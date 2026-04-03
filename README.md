# Strus Camp Landing Page

Static Astro landing page hosted on Cloudflare Pages.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

## Cloudflare Pages setup

Build command:

```sh
npm run build
```

Build output directory:

```txt
dist
```

Set Node.js compatibility/version to 22 in Cloudflare Pages.

## SEO config

Set `SITE_URL` in Cloudflare Pages environment variables to your final domain.

Example:

```txt
SITE_URL=https://camp.twojadomena.pl
```

The sitemap is generated automatically from `SITE_URL`.

## Contact form email delivery

Form posts to a Cloudflare Pages Function at `/api/register` and sends email through Resend.

Required Cloudflare env variables:

```txt
RESEND_API_KEY=...
CONTACT_TO_EMAIL=client@example.com
```

Optional:

```txt
CONTACT_FROM_EMAIL=noreply@yourdomain.com
TURNSTILE_SECRET=...
PUBLIC_TURNSTILE_SITE_KEY=...
```

Notes:

- `CONTACT_TO_EMAIL` is where client receives submissions.
- If `TURNSTILE_SECRET` and `PUBLIC_TURNSTILE_SITE_KEY` are set, bot protection is enabled.
- If no `CONTACT_FROM_EMAIL` is set, fallback sender is `onboarding@resend.dev`.
