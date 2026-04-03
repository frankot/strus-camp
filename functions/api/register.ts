interface Env {
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL?: string;
  RESEND_API_KEY: string;
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

    const fromEmail = context.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [context.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Nowe zgloszenie Sport Camp: ${firstName} ${lastName}`,
        text: [
          "Nowe zgloszenie z formularza.",
          "",
          `Imie: ${firstName}`,
          `Nazwisko: ${lastName}`,
          `Telefon: ${phone}`,
          `Email: ${email}`,
          `Wspollokator: ${roommate || "brak"}`,
          "",
          "Wiadomosc:",
          message || "brak",
        ].join("\n"),
      }),
    });

    if (!emailResponse.ok) {
      return redirect(errorRedirect);
    }

    return redirect(successRedirect);
  } catch {
    return redirect(errorRedirect);
  }
};
