---
title: "Strus Camp"
date: "2026-04-12"
description: "Sports camp landing page with registration form — designed, built, and deployed overnight. Static Astro site on Cloudflare Pages with SMTP email delivery."
overview: "Single-page landing site for Strus Camp — a 4-day martial arts and mountain sports camp in Zakopane organized by Piotr Strus. The client needed a registration website live by the next morning. Designed, built, and deployed to a custom domain in one session. Registration form sends participant data via email using Cloudflare Pages Functions and raw SMTP."
url: "https://strus-camp.pages.dev"
repo: "https://github.com/frankot/strus-camp"
image: "/projects/strus-camp/hero.png"
images: ["/projects/strus-camp/hero.png"]
stack: ["Astro 6", "Tailwind CSS v4", "TypeScript", "Cloudflare Pages", "Cloudflare Turnstile", "SMTP"]
client: "Piotr Strus"
type: "Landing page"
timeline: "Overnight (~12 hours from brief to live)"
status: "Live"
features:
  - title: "Registration Form with Email Delivery"
    description: "Collects participant details (name, phone, email, referral) and sends the data to the organizer via SMTP — plus an automatic confirmation email to the participant with payment instructions."
  - title: "Cloudflare Turnstile"
    description: "Bot protection on the form without CAPTCHAs. Validates server-side before sending any email."
  - title: "Scroll-Snap Sections"
    description: "Full-viewport sections with scroll snapping on desktop — hero, camp details, schedule & pricing, registration form."
  - title: "Referral Discount System"
    description: "Built-in referral field — participants can name who referred them and both get a discount, tracked through form submissions."
results:
  - "Live on a custom domain the next morning — client started sharing the link immediately"
  - "Zero running costs — Cloudflare Pages free tier, no database, no third-party form service"
  - "Fully static except for one serverless function — loads instantly on any connection"
---

## The Problem

The client runs martial arts training camps in the Tatra Mountains. He needed a website to advertise the next camp and collect registrations — and he needed it live by the next day. No time for back-and-forth, no complex requirements. Just a clean page with camp details and a form that sends participant data to his email.

## Approach

**Speed was the only constraint.** The client described what he needed, I proposed a design, and started building immediately. Static Astro site — no framework overhead, no build complexity. Tailwind for styling, deployed to Cloudflare Pages for instant global delivery.

**No external services.** The registration form posts to a single Cloudflare Pages Function that sends email via raw SMTP (using Cloudflare's `connect` socket API). No form backends, no database, no third-party dependencies. The organizer gets a notification email with all participant details, and the participant gets an automatic confirmation with payment instructions and venue info.

**Spam protection without friction.** Cloudflare Turnstile runs invisibly — no puzzles, no checkboxes. Server-side validation catches bots, honeypot field catches the rest.

## Challenges

**Raw SMTP on Cloudflare Workers.** Cloudflare doesn't support Node.js `net` or `nodemailer`. The email function uses `cloudflare:sockets` to open a raw TLS connection and speaks the SMTP protocol directly — EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA, base64-encoded MIME. No libraries, no dependencies.

**Polish character encoding.** Camp details, confirmation emails, and form submissions all use Polish characters. The SMTP function handles UTF-8 encoding with base64 content transfer to ensure nothing breaks across email clients.
