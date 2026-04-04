import { connect } from "cloudflare:sockets";

interface Env {
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  SMTP_HOST: string;
  SMTP_PORT?: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  TURNSTILE_SECRET?: string;
}

const successRedirect = "/?form=success#contact";
const errorRedirect = "/?form=error#contact";

const redirect = (url: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: url },
  });

const verifyTurnstile = async (token: string, secret: string, ip?: string) => {
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean };
  return Boolean(result.success);
};

function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${encodeUtf8Base64(subject)}?=`;
}

function buildMimeMessage(options: {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): string {
  const b64Body = encodeUtf8Base64(options.text);
  const b64Lines = b64Body.match(/.{1,76}/g)?.join("\r\n") || "";

  const headers = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    ...(options.replyTo ? [`Reply-To: ${options.replyTo}`] : []),
    `Subject: ${encodeSubject(options.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
  ];

  return headers.join("\r\n") + "\r\n\r\n" + b64Lines;
}

async function smtpSend(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const socket = connect(
    { hostname: options.host, port: options.port },
    { secureTransport: "on" },
  );

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const read = async (): Promise<string> => {
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\r\n").filter((l) => l.length > 0);
      const last = lines[lines.length - 1];
      if (last && last.length >= 4 && last[3] === " ") break;
    }
    return buf;
  };

  const send = async (cmd: string): Promise<string> => {
    await writer.write(encoder.encode(cmd + "\r\n"));
    return read();
  };

  const expect = (response: string, code: number) => {
    if (!response.startsWith(String(code))) {
      throw new Error(`SMTP expected ${code}, got: ${response.trim()}`);
    }
  };

  try {
    expect(await read(), 220);
    await send("EHLO localhost");
    expect(await send("AUTH LOGIN"), 334);
    expect(await send(btoa(options.user)), 334);
    expect(await send(btoa(options.pass)), 235);
    expect(await send(`MAIL FROM:<${options.from}>`), 250);
    expect(await send(`RCPT TO:<${options.to}>`), 250);
    expect(await send("DATA"), 354);

    const mime = buildMimeMessage({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      replyTo: options.replyTo,
    });

    expect(await send(mime + "\r\n."), 250);
    await send("QUIT");
  } finally {
    try {
      await writer.close();
    } catch {}
    try {
      reader.releaseLock();
      await socket.close();
    } catch {}
  }
}

function buildConfirmationText(firstName: string): string {
  return [
    `Cześć ${firstName}!`,
    `Dziękujemy za zgłoszenie na Strus Camp 2026!`,
    `Cieszymy się, że dołączasz do naszego obozu sportowego – to będzie intensywny i pełen energii czas!`,
    ``,
    `📅 Termin obozu: 23–26 kwietnia 2026 (UWAGA! zakwaterowanie od 22.04.2026 godz 17:00 Wymeldowanie 26.04.2026 po obiedzie)`,
    `📍 Miejsce: Willa Basieńka, ul. Brzozowskiego 24a 34-500 Zakopane`,
    `💰 Wpłata: prosimy o dokonanie płatności 700 zł na poniższe konto do 21 kwietnia 2026`,
    ``,
    `Dane do przelewu:`,
    `PIOTR STRUS`,
    `nr konta: 96 1140 2004 0000 3502 4838 1052`,
    `Blik: +48 608 052 555`,
    `Tytuł: ${firstName} - obóz 23-26.04`,
    ``,
    `📞 W razie pytań jestem do dyspozycji: +48 608 052 555`,
    ``,
    `Do zobaczenia na obozie!`,
    `Strus Camp`,
  ].join("\n");
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();

    const honeyPot = String(formData.get("company") || "").trim();
    if (honeyPot) {
      return redirect(successRedirect);
    }

    const firstName = String(formData.get("imie") || "").trim();
    const lastName = String(formData.get("nazwisko") || "").trim();
    const phone = String(formData.get("telefon") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const roommate = String(formData.get("wspolokator") || "").trim();
    const message = String(formData.get("wiadomosc") || "").trim();

    if (!firstName || !lastName || !phone || !email) {
      return redirect(errorRedirect);
    }

    if (
      firstName.length > 120 ||
      lastName.length > 120 ||
      phone.length > 40 ||
      email.length > 200 ||
      roommate.length > 200 ||
      message.length > 2000
    ) {
      return redirect(errorRedirect);
    }

    if (context.env.TURNSTILE_SECRET) {
      const token = String(formData.get("cf-turnstile-response") || "").trim();
      if (!token) {
        return redirect(errorRedirect);
      }

      const ip = context.request.headers.get("CF-Connecting-IP") || undefined;
      const validTurnstile = await verifyTurnstile(
        token,
        context.env.TURNSTILE_SECRET,
        ip,
      );
      if (!validTurnstile) {
        return redirect(errorRedirect);
      }
    }

    const smtpConfig = {
      host: context.env.SMTP_HOST,
      port: Number(context.env.SMTP_PORT || "465"),
      user: context.env.SMTP_USER,
      pass: context.env.SMTP_PASS,
    };
    const fromEmail = context.env.CONTACT_FROM_EMAIL;

    // Send admin notification
    await smtpSend({
      ...smtpConfig,
      from: fromEmail,
      to: context.env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Nowe zgloszenie Strus Camp: ${firstName} ${lastName}`,
      text: [
        "Nowe zgloszenie z formularza.",
        "",
        `Imie: ${firstName}`,
        `Nazwisko: ${lastName}`,
        `Telefon: ${phone}`,
        `Email: ${email}`,
        `Os. polecajaca: ${roommate || "brak"}`,
        "",
        "Wiadomosc:",
        message || "brak",
      ].join("\n"),
    });

    // Send confirmation to user
    await smtpSend({
      ...smtpConfig,
      from: fromEmail,
      to: email,
      subject: `Potwierdzenie zgłoszenia – Strus Camp 2026`,
      text: buildConfirmationText(firstName),
    });

    return redirect(successRedirect);
  } catch {
    return redirect(errorRedirect);
  }
};
