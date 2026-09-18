import { connect } from "cloudflare:sockets";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** Use STARTTLS on a plaintext port (587) instead of implicit TLS (465). */
  startTls: boolean;
}

export interface MailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Per read/write deadline. Pages Functions have no socket timeout of their own. */
const SMTP_TIMEOUT_MS = 15_000;

export class SmtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmtpError";
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  label: string,
): Promise<T> {
  let timer: number | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new SmtpError(`timed out waiting for ${label}`)),
          SMTP_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function base64Bytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64Utf8(value: string): string {
  return base64Bytes(new TextEncoder().encode(value));
}

/**
 * RFC 2047 encoded words folded onto continuation lines. 33 bytes encode to a
 * 44 character payload, so "Subject: =?UTF-8?B?...?=" stays inside the 78
 * character line limit. Splitting happens on UTF-8 character boundaries so
 * Polish diacritics survive.
 */
function encodeHeaderText(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const words: string[] = [];
  let start = 0;

  while (start < bytes.length) {
    let end = Math.min(start + 33, bytes.length);
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
      end -= 1;
    }
    words.push(`=?UTF-8?B?${base64Bytes(bytes.subarray(start, end))}?=`);
    start = end;
  }

  return words.join("\r\n ");
}

/** Headers are single-line by definition: fold nothing, inject nothing. */
function headerValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function rfc2822Date(date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${days[date.getUTCDay()]},`,
    pad(date.getUTCDate()),
    months[date.getUTCMonth()],
    date.getUTCFullYear(),
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
    "+0000",
  ].join(" ");
}

function domainOf(address: string): string {
  return address.split("@")[1] ?? "localhost";
}

export function buildMimeMessage(message: MailMessage): string {
  const body = base64Utf8(message.text).match(/.{1,76}/g)?.join("\r\n") ?? "";

  const headers = [
    `Date: ${rfc2822Date()}`,
    `Message-ID: <${crypto.randomUUID()}@${headerValue(domainOf(message.from))}>`,
    `From: ${headerValue(message.from)}`,
    `To: ${headerValue(message.to)}`,
    ...(message.replyTo ? [`Reply-To: ${headerValue(message.replyTo)}`] : []),
    `Subject: ${encodeHeaderText(headerValue(message.subject))}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

function authMechanisms(ehloResponse: string): string[] {
  const line = ehloResponse
    .split("\r\n")
    .find((candidate) => /^250[- ]AUTH\b/i.test(candidate));

  return line ? line.slice(9).trim().toUpperCase().split(/\s+/) : [];
}

export async function smtpSend(
  config: SmtpConfig,
  message: MailMessage,
): Promise<void> {
  const ehloName = domainOf(message.from);

  let socket = connect(
    { hostname: config.host, port: config.port },
    {
      secureTransport: config.startTls ? "starttls" : "on",
      allowHalfOpen: false,
    },
  );

  let writer = socket.writable.getWriter();
  let reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  /**
   * Pulls one complete reply (including multiline 250-… continuations) out of
   * the buffer, leaving anything the server sent ahead of time in place.
   */
  const takeReply = (): string | null => {
    const lines: string[] = [];
    let cursor = 0;

    while (true) {
      const lineEnd = buffer.indexOf("\r\n", cursor);
      if (lineEnd === -1) {
        return null;
      }

      const line = buffer.slice(cursor, lineEnd);
      lines.push(line);
      cursor = lineEnd + 2;

      if (line.length < 4 || line[3] === " ") {
        buffer = buffer.slice(cursor);
        return lines.join("\r\n");
      }
    }
  };

  const readReply = async (label: string): Promise<string> => {
    while (true) {
      const reply = takeReply();
      if (reply !== null) {
        return reply;
      }

      const { value, done } = await withTimeout(reader.read(), label);
      if (done) {
        throw new SmtpError(
          `${config.host} closed the connection while waiting for ${label}`,
        );
      }
      buffer += decoder.decode(value, { stream: true });
    }
  };

  /** `label` is logged instead of `line`, which may hold credentials. */
  const command = async (line: string, label: string): Promise<string> => {
    await withTimeout(writer.write(encoder.encode(`${line}\r\n`)), label);
    return readReply(label);
  };

  const expect = (reply: string, codes: number[], label: string): string => {
    if (!codes.some((code) => reply.startsWith(String(code)))) {
      throw new SmtpError(
        `${label}: expected ${codes.join("/")}, got "${reply.trim().slice(0, 200)}"`,
      );
    }
    return reply;
  };

  try {
    expect(await readReply("greeting"), [220], "greeting");
    let ehlo = expect(await command(`EHLO ${ehloName}`, "EHLO"), [250], "EHLO");

    if (config.startTls) {
      expect(await command("STARTTLS", "STARTTLS"), [220], "STARTTLS");

      // Hand the raw streams back before upgrading, then rebind to the TLS socket.
      reader.releaseLock();
      writer.releaseLock();
      socket = socket.startTls();
      writer = socket.writable.getWriter();
      reader = socket.readable.getReader();
      buffer = "";

      ehlo = expect(
        await command(`EHLO ${ehloName}`, "EHLO (TLS)"),
        [250],
        "EHLO (TLS)",
      );
    }

    const mechanisms = authMechanisms(ehlo);

    if (mechanisms.length === 0 || mechanisms.includes("LOGIN")) {
      expect(await command("AUTH LOGIN", "AUTH LOGIN"), [334], "AUTH LOGIN");
      expect(
        await command(base64Utf8(config.user), "AUTH username"),
        [334],
        "AUTH username",
      );
      expect(
        await command(base64Utf8(config.pass), "AUTH password"),
        [235],
        "AUTH password",
      );
    } else if (mechanisms.includes("PLAIN")) {
      expect(
        await command(
          `AUTH PLAIN ${base64Utf8(`\0${config.user}\0${config.pass}`)}`,
          "AUTH PLAIN",
        ),
        [235],
        "AUTH PLAIN",
      );
    } else {
      throw new SmtpError(
        `${config.host} offers no supported AUTH mechanism (${mechanisms.join(", ")})`,
      );
    }

    expect(
      await command(`MAIL FROM:<${headerValue(message.from)}>`, "MAIL FROM"),
      [250],
      "MAIL FROM",
    );
    expect(
      await command(`RCPT TO:<${headerValue(message.to)}>`, "RCPT TO"),
      [250, 251],
      "RCPT TO",
    );
    expect(await command("DATA", "DATA"), [354], "DATA");
    expect(
      await command(`${buildMimeMessage(message)}\r\n.`, "message body"),
      [250],
      "message body",
    );

    try {
      await command("QUIT", "QUIT");
    } catch {
      // The server is allowed to drop the connection instead of replying 221.
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
    try {
      writer.releaseLock();
    } catch {}
    try {
      await withTimeout(socket.close(), "close");
    } catch {}
  }
}
