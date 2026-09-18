import { smtpSend, type MailMessage, type SmtpConfig } from "./smtp";

interface Env {
  /** Pages binding for the static build output in `dist`. */
  ASSETS: Fetcher;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  SMTP_HOST: string;
  SMTP_PORT?: string;
  /** "true"/"false" to override the default (STARTTLS only on port 587). */
  SMTP_STARTTLS?: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  TURNSTILE_SECRET?: string;
}

const SUCCESS_REDIRECT = "/?form=success#contact";
const ERROR_REDIRECT = "/?form=error#contact";

const REQUIRED_ENV = [
  "CONTACT_TO_EMAIL",
  "CONTACT_FROM_EMAIL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

/**
 * Deliberately strict: anything with whitespace (so CR/LF), a comma, a
 * semicolon or angle brackets is rejected before it can reach an SMTP command
 * or a message header.
 */
const EMAIL_PATTERN = /^[^\s@<>,;:"\\]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

const FIELD_LIMITS = {
  imie: 120,
  nazwisko: 120,
  telefon: 40,
  email: 200,
  wspolokator: 200,
  wiadomosc: 2000,
} as const;

const redirect = (location: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });

/** Collapses control characters that have no business in a form field. */
const field = (data: FormData, name: string): string =>
  String(data.get(name) ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim();

const verifyTurnstile = async (
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> => {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );

  if (!response.ok) {
    console.error(`Turnstile siteverify returned ${response.status}`);
    return false;
  }

  const result = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (!result.success) {
    console.error(
      `Turnstile rejected the token: ${(result["error-codes"] ?? []).join(", ")}`,
    );
  }

  return Boolean(result.success);
};

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

function readSmtpConfig(env: Env): SmtpConfig | null {
  const missing = REQUIRED_ENV.filter((name) => !env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    return null;
  }

  const port = Number.parseInt(env.SMTP_PORT ?? "465", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Invalid SMTP_PORT: "${env.SMTP_PORT}"`);
    return null;
  }
  if (port === 25) {
    console.error("Port 25 is blocked on Cloudflare Workers; use 465 or 587.");
    return null;
  }

  if (!EMAIL_PATTERN.test(env.CONTACT_FROM_EMAIL)) {
    console.error(`Invalid CONTACT_FROM_EMAIL: "${env.CONTACT_FROM_EMAIL}"`);
    return null;
  }
  if (!EMAIL_PATTERN.test(env.CONTACT_TO_EMAIL)) {
    console.error(`Invalid CONTACT_TO_EMAIL: "${env.CONTACT_TO_EMAIL}"`);
    return null;
  }

  return {
    host: env.SMTP_HOST,
    port,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    startTls: env.SMTP_STARTTLS
      ? env.SMTP_STARTTLS.toLowerCase() === "true"
      : port === 587,
  };
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Could not parse the form body", error);
    return redirect(ERROR_REDIRECT);
  }

  // Honeypot: pretend it worked so bots do not learn anything.
  if (field(formData, "company")) {
    return redirect(SUCCESS_REDIRECT);
  }

  const firstName = field(formData, "imie");
  const lastName = field(formData, "nazwisko");
  const phone = field(formData, "telefon");
  const email = field(formData, "email");
  const roommate = field(formData, "wspolokator");
  const message = field(formData, "wiadomosc");

  if (!firstName || !lastName || !phone || !email) {
    return redirect(ERROR_REDIRECT);
  }

  const values: Record<keyof typeof FIELD_LIMITS, string> = {
    imie: firstName,
    nazwisko: lastName,
    telefon: phone,
    email,
    wspolokator: roommate,
    wiadomosc: message,
  };

  for (const [name, limit] of Object.entries(FIELD_LIMITS)) {
    if (values[name as keyof typeof FIELD_LIMITS].length > limit) {
      return redirect(ERROR_REDIRECT);
    }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return redirect(ERROR_REDIRECT);
  }

  if (env.TURNSTILE_SECRET) {
    const token = field(formData, "cf-turnstile-response");
    if (!token) {
      return redirect(ERROR_REDIRECT);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET, ip))) {
      return redirect(ERROR_REDIRECT);
    }
  }

  const smtp = readSmtpConfig(env);
  if (!smtp) {
    return redirect(ERROR_REDIRECT);
  }

  const notification: MailMessage = {
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
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
  };

  // The notification is the submission: if it fails, the signup is lost.
  try {
    await smtpSend(smtp, notification);
  } catch (error) {
    console.error("Could not send the registration notification", error);
    return redirect(ERROR_REDIRECT);
  }

  // The confirmation is a courtesy. A typo'd address must not make a stored
  // submission look like a failure to the person who just sent it.
  try {
    await smtpSend(smtp, {
      from: env.CONTACT_FROM_EMAIL,
      to: email,
      subject: "Potwierdzenie zgłoszenia – Strus Camp 2026",
      text: buildConfirmationText(firstName),
    });
  } catch (error) {
    console.error(`Could not send the confirmation to ${email}`, error);
  }

  return redirect(SUCCESS_REDIRECT);
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/register") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }

      try {
        return await handleRegister(request, env);
      } catch (error) {
        console.error("Unhandled error in /api/register", error);
        return redirect(ERROR_REDIRECT);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
