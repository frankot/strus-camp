# Strus Camp Landing Page

Static Astro landing page hosted on Cloudflare Pages. The registration form is
handled by a small Cloudflare Worker that is bundled into the build output as
`dist/_worker.js`.

## Local development

```sh
npm install
npm run dev
```

`npm run dev` serves the static site only — the form endpoint does not exist in
`astro dev`. To test the form locally, copy `.dev.vars.example` to `.dev.vars`,
fill in the SMTP values and run:

```sh
npm run preview:pages
```

## Production build

```sh
npm run build
```

This runs two steps:

1. `astro build` — the static site into `dist/`
2. `npm run build:worker` — `worker/index.ts` bundled to `dist/_worker.js`

Both artifacts must be present in the uploaded directory. `dist/_routes.json`
(copied from `public/`) keeps the Worker on `/api/*` so static pages are served
straight from the CDN.

## Deploying

### Option A — drag and drop the build output

```sh
npm run zip   # builds, then writes dist.zip with the files at the archive root
```

Upload `dist.zip` (or the `dist` folder itself) in the Pages dashboard.

> **Important:** upload the *contents* of `dist`, not a folder containing it.
> `_worker.js` and `_routes.json` must sit at the root of the deployment.

### Option B — Wrangler

```sh
npm run deploy
```

### Why the form used to return 405

The handler previously lived in `functions/api/register.ts`. Cloudflare
compiles a `functions/` directory only for Git-integration builds and
`wrangler pages deploy` — [drag-and-drop uploads from the dashboard do not
compile it](https://developers.cloudflare.com/pages/get-started/direct-upload/).
The uploaded `dist` contained static assets only, so `POST /api/register` hit
the static asset handler, which answers anything other than `GET`/`HEAD` with
**405 Method Not Allowed**. A `_worker.js` in the output directory is supported
by both upload methods, which is why the handler now builds into `dist`.

## Environment variables

Set these in the Pages project (Settings → Environment variables). Mark
`SMTP_PASS` and `TURNSTILE_SECRET` as encrypted.

| Variable | Required | Notes |
| --- | --- | --- |
| `SMTP_HOST` | yes | e.g. `smtp.hostinger.com` |
| `SMTP_USER` | yes | SMTP account login |
| `SMTP_PASS` | yes | SMTP account password |
| `SMTP_PORT` | no | `465` (default, implicit TLS) or `587` (STARTTLS). Port 25 is blocked on Cloudflare and is rejected. |
| `SMTP_STARTTLS` | no | `true`/`false` override; defaults to `true` only on port 587 |
| `CONTACT_TO_EMAIL` | yes | where submissions are delivered |
| `CONTACT_FROM_EMAIL` | yes | envelope sender; its domain should match the SMTP account |
| `TURNSTILE_SECRET` | no | enables bot verification server-side |
| `PUBLIC_TURNSTILE_SITE_KEY` | no | build-time; renders the Turnstile widget |
| `SITE_URL` | no | canonical URL for sitemap/SEO |

If a required variable is missing, the form redirects to `/?form=error#contact`
and the reason is written to the Worker log (Pages → Deployment → Functions
logs, or `npx wrangler pages deployment tail`).

## Form behaviour

- `POST /api/register` always answers with a 303 redirect to
  `/?form=success#contact` or `/?form=error#contact`.
- The client notification decides the outcome. The applicant's confirmation
  email is best-effort: a bad address is logged but still reports success, so a
  received submission is never shown as a failure.
- Email addresses are validated before use; anything containing whitespace,
  commas or angle brackets is rejected, which also blocks CR/LF injection into
  SMTP commands and message headers.
- A hidden `company` field is a honeypot: a filled value reports success and
  sends nothing.
- There is no rate limiting beyond Turnstile. If the endpoint gets abused,
  enable Turnstile (both variables) or add a Cloudflare WAF rate-limit rule on
  `/api/register`.

## SEO config

Set `SITE_URL` in Cloudflare Pages environment variables to the final domain:

```txt
SITE_URL=https://camp.twojadomena.pl
```

The sitemap is generated automatically from `SITE_URL`.
