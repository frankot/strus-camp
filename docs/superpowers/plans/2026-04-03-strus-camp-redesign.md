# Strus Camp Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign strus.net.pl as a bold, minimal one-pager with alternating dark/warm sections, Tatras panorama parallax, and "amber line" motif.

**Architecture:** Astro 6 static site with Tailwind CSS v4. All components are pure `.astro` files — no JS frameworks. Rewrite each existing scaffold component in-place. Design tokens defined via Tailwind v4's CSS-based `@theme` in `global.css`.

**Tech Stack:** Astro 6, Tailwind CSS v4 (Vite plugin), HTML/CSS only, mailto form action.

**Design spec:** `docs/superpowers/specs/2026-04-03-strus-camp-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/styles/global.css` | Modify | Tailwind v4 `@theme` tokens (colors, fonts), base resets |
| `src/layouts/MainLayout.astro` | Modify | Update body classes, meta description, title |
| `src/pages/index.astro` | Modify | Remove Nav import, rename components, update composition |
| `src/components/Nav.astro` | Delete | No navbar in redesign |
| `src/components/Hero.astro` | Rewrite | Dark hero with massive title, CTAs, quick facts |
| `src/components/About.astro` | Rewrite → rename to `Panorama.astro` | Parallax panorama bg + horizontal scroll feature cards |
| `src/components/Pricing.astro` | Rewrite → rename to `Schedule.astro` | Two-column schedule + pricing on dark bg |
| `src/components/ContactForm.astro` | Rewrite | Warm bg, centered form, 5 fields, mailto action |
| `src/components/Footer.astro` | Rewrite | Dark footer with contact info + copyright |

---

### Task 1: Design Tokens & Global Styles

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace global.css with design tokens and base styles**

```css
@import "tailwindcss";

@theme {
  /* Dark section palette */
  --color-dark-bg: #1a1714;
  --color-dark-surface: #262220;
  --color-dark-text: #f5f0e8;
  --color-dark-muted: #a8a29e;

  /* Warm section palette */
  --color-warm-bg: #f5f0e8;
  --color-warm-surface: #e8dfd2;
  --color-warm-text: #1c1917;
  --color-warm-muted: #78716c;

  /* Accent */
  --color-accent: #d97706;
  --color-accent-dark: #b45309;

  /* Typography */
  --font-heading: "Bebas Neue", system-ui, sans-serif;
  --font-body: "Satoshi", system-ui, sans-serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    font-family: var(--font-body);
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button,
  input,
  textarea {
    font: inherit;
  }

  textarea {
    resize: vertical;
  }

  * {
    box-sizing: border-box;
  }

  :focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}
```

- [ ] **Step 2: Verify tokens resolve**

Run: `npm run dev`
Expected: Dev server starts without errors. Tailwind compiles custom theme tokens.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add design tokens and custom theme for strus camp redesign"
```

---

### Task 2: Layout & Page Composition

**Files:**
- Modify: `src/layouts/MainLayout.astro`
- Modify: `src/pages/index.astro`
- Delete: `src/components/Nav.astro`

- [ ] **Step 1: Update MainLayout.astro**

Replace the full file content with:

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
}

const { title = "Sport Camp Piotr Strus — Obóz Sportowy Tatry 2026" } = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Obóz sportowy z Piotrem Strusem w Tatrach. Treningi MMA, górskie wycieczki, pełne wyżywienie. 23–26 kwietnia 2026, Zakopane." />
    <meta name="generator" content={Astro.generator} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
    <title>{title}</title>
  </head>
  <body class="bg-dark-bg text-dark-text font-body">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Update index.astro**

Replace the full file content with:

```astro
---
import Hero from "../components/Hero.astro";
import Panorama from "../components/Panorama.astro";
import Schedule from "../components/Schedule.astro";
import ContactForm from "../components/ContactForm.astro";
import Footer from "../components/Footer.astro";
import MainLayout from "../layouts/MainLayout.astro";
---

<MainLayout>
  <main>
    <Hero />
    <Panorama />
    <Schedule />
    <ContactForm />
  </main>
  <Footer />
</MainLayout>
```

- [ ] **Step 3: Delete Nav.astro**

```bash
rm src/components/Nav.astro
```

- [ ] **Step 4: Create empty placeholder files for renamed components**

Create `src/components/Panorama.astro`:
```astro
<section id="panorama"></section>
```

Create `src/components/Schedule.astro`:
```astro
<section id="schedule"></section>
```

- [ ] **Step 5: Verify dev server runs**

Run: `npm run dev`
Expected: Page renders with hero placeholder (still old scaffold content), empty panorama/schedule sections, contact form, footer. No errors.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/MainLayout.astro src/pages/index.astro src/components/Panorama.astro src/components/Schedule.astro
git rm src/components/Nav.astro
git rm src/components/About.astro
git rm src/components/Pricing.astro
git commit -m "feat: restructure page composition — remove nav, rename components"
```

---

### Task 3: Hero Component

**Files:**
- Rewrite: `src/components/Hero.astro`

- [ ] **Step 1: Rewrite Hero.astro**

Replace the full file content with:

```astro
<section id="hero" class="relative flex min-h-screen flex-col items-center justify-center bg-dark-bg px-6 py-20 text-center">
  <!-- Optional background texture/photo overlay -->
  <div class="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-bg/95 to-dark-bg" aria-hidden="true"></div>

  <div class="relative z-10 mx-auto w-full max-w-6xl">
    <p class="mb-6 text-xs uppercase tracking-[0.4em] text-dark-muted">
      Piotr Strus zaprasza
    </p>

    <h1 class="font-heading text-[clamp(3rem,10vw,6rem)] uppercase leading-[0.9] tracking-tight text-dark-text">
      Sport<br />Camp
    </h1>

    <!-- Amber line motif -->
    <div class="mx-auto mt-6 h-[3px] w-12 bg-accent" aria-hidden="true"></div>

    <p class="mt-6 text-sm uppercase tracking-[0.15em] text-dark-muted">
      Tatry · 23–26 Kwietnia 2026
    </p>

    <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a
        href="#contact"
        class="bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-dark-bg transition-colors hover:bg-accent-dark"
      >
        Zapisz się
      </a>
      <a
        href="#panorama"
        class="border border-dark-muted px-6 py-3 text-sm uppercase tracking-wider text-dark-text transition-colors hover:border-dark-text"
      >
        Szczegóły
      </a>
    </div>

    <!-- Quick facts -->
    <div class="mx-auto mt-16 flex max-w-md flex-wrap justify-center gap-8 text-center">
      <div>
        <p class="text-lg font-bold text-dark-text">23–26.04</p>
        <p class="mt-1 text-xs uppercase tracking-wider text-dark-muted">Termin</p>
      </div>
      <div>
        <p class="text-lg font-bold text-dark-text">Zakopane</p>
        <p class="mt-1 text-xs uppercase tracking-wider text-dark-muted">Lokalizacja</p>
      </div>
      <div>
        <p class="text-lg font-bold text-accent">1399 zł</p>
        <p class="mt-1 text-xs uppercase tracking-wider text-dark-muted">Od / os.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify hero renders**

Run: `npm run dev`
Expected: Full-height dark hero with massive "SPORT CAMP" title, amber divider, two CTA buttons, quick facts row at bottom. All text readable on dark background.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: implement dark hero with massive title, CTAs, and quick facts"
```

---

### Task 4: Panorama + Feature Cards Component

**Files:**
- Rewrite: `src/components/Panorama.astro`

- [ ] **Step 1: Rewrite Panorama.astro**

Replace the full file content with:

```astro
<section id="panorama" class="relative overflow-hidden">
  <!-- Parallax background — will use real photo later -->
  <!-- background-attachment:fixed doesn't work on iOS, so we use a fallback approach -->
  <div
    class="absolute inset-0 bg-cover bg-fixed bg-center supports-[-webkit-touch-callout:none]:bg-scroll"
    style="background-image: url('/images/tatry-panorama.jpg'); background-color: #4a6741;"
    aria-hidden="true"
  >
  </div>

  <!-- Dark overlay for readability -->
  <div class="absolute inset-0 bg-dark-bg/60" aria-hidden="true"></div>

  <div class="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
    <!-- Section header -->
    <div class="mb-8 text-center">
      <p class="text-xs uppercase tracking-[0.3em] text-accent">Co zawiera obóz</p>
      <h2 class="mt-2 font-heading text-[clamp(1.75rem,4vw,2.5rem)] uppercase text-dark-text">
        4 dni, które zapamiętasz
      </h2>
    </div>

    <!-- Horizontal scroll cards -->
    <div class="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
      <article class="min-w-[260px] shrink-0 snap-start rounded-md bg-warm-bg/95 p-6 backdrop-blur-sm lg:min-w-0">
        <h3 class="text-lg font-bold text-warm-text">Treningi</h3>
        <p class="mt-2 text-sm leading-relaxed text-warm-muted">
          Codzienne zajęcia z elementami boksu, kick-boxingu i MMA pod okiem Piotra Strusa.
        </p>
        <div class="mt-4 h-[3px] w-6 bg-accent" aria-hidden="true"></div>
      </article>

      <article class="min-w-[260px] shrink-0 snap-start rounded-md bg-warm-bg/95 p-6 backdrop-blur-sm lg:min-w-0">
        <h3 class="text-lg font-bold text-warm-text">Góry</h3>
        <p class="mt-2 text-sm leading-relaxed text-warm-muted">
          Codzienne wyjścia w Tatry — szlaki dopasowane do kondycji grupy.
        </p>
        <div class="mt-4 h-[3px] w-6 bg-accent" aria-hidden="true"></div>
      </article>

      <article class="min-w-[260px] shrink-0 snap-start rounded-md bg-warm-bg/95 p-6 backdrop-blur-sm lg:min-w-0">
        <h3 class="text-lg font-bold text-warm-text">Zakwaterowanie</h3>
        <p class="mt-2 text-sm leading-relaxed text-warm-muted">
          Willa Basieńka w centrum Zakopanego. Pokoje 2–3 osobowe z możliwością wyboru współlokatora.
        </p>
        <div class="mt-4 h-[3px] w-6 bg-accent" aria-hidden="true"></div>
      </article>

      <article class="min-w-[260px] shrink-0 snap-start rounded-md bg-warm-bg/95 p-6 backdrop-blur-sm lg:min-w-0">
        <h3 class="text-lg font-bold text-warm-text">Wyżywienie</h3>
        <p class="mt-2 text-sm leading-relaxed text-warm-muted">
          Pełne wyżywienie — 3 posiłki dziennie przez cały pobyt. Od kolacji 22.04 do śniadania 26.04.
        </p>
        <div class="mt-4 h-[3px] w-6 bg-accent" aria-hidden="true"></div>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add scrollbar-hide utility to global.css**

Append to the end of `src/styles/global.css` (after the `@layer base` block):

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 3: Create images directory placeholder**

```bash
mkdir -p public/images
```

Create a placeholder note file `public/images/.gitkeep` so the directory is tracked. The real `tatry-panorama.jpg` will be added later by the user. The component's `background-color: #4a6741` serves as a green-tinted fallback until the photo is provided.

- [ ] **Step 4: Verify panorama section renders**

Run: `npm run dev`
Expected: Green-tinted background (placeholder for photo) with dark overlay. Section header in amber + white. Four horizontal-scrolling cards with frosted glass appearance on mobile, 4-column grid on desktop. Each card has an amber line at the bottom.

- [ ] **Step 5: Commit**

```bash
git add src/components/Panorama.astro src/styles/global.css public/images/.gitkeep
git commit -m "feat: implement panorama section with parallax bg and horizontal scroll cards"
```

---

### Task 5: Schedule & Pricing Component

**Files:**
- Rewrite: `src/components/Schedule.astro`

- [ ] **Step 1: Rewrite Schedule.astro**

Replace the full file content with:

```astro
<section id="schedule" class="bg-dark-bg">
  <div class="mx-auto w-full max-w-6xl px-6 py-20">
    <div class="grid gap-16 lg:grid-cols-2 lg:gap-12">
      <!-- Schedule column -->
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-accent">Plan dnia</p>
        <h2 class="mt-2 font-heading text-[clamp(1.75rem,4vw,2.5rem)] uppercase text-dark-text">
          Codzienny rytm
        </h2>

        <dl class="mt-8 space-y-4">
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">07:00</dt>
            <dd class="text-sm text-dark-text">Rozruch</dd>
          </div>
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">08:00</dt>
            <dd class="text-sm text-dark-text">Śniadanie</dd>
          </div>
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">09:30</dt>
            <dd class="text-sm text-dark-text">Wyjście w góry</dd>
          </div>
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">13:00</dt>
            <dd class="text-sm text-dark-text">Obiad</dd>
          </div>
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">15:00</dt>
            <dd class="text-sm text-dark-text">Trening sportów walki</dd>
          </div>
          <div class="flex items-baseline gap-4">
            <dt class="w-14 shrink-0 text-sm font-bold text-accent">19:00</dt>
            <dd class="text-sm text-dark-text">Kolacja</dd>
          </div>
        </dl>
      </div>

      <!-- Pricing column -->
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-accent">Cena i wpłata</p>
        <h2 class="mt-2 font-heading text-[clamp(1.75rem,4vw,2.5rem)] uppercase text-dark-text">
          Ile kosztuje
        </h2>

        <!-- Promotional price -->
        <div class="mt-8 rounded border-l-[3px] border-accent bg-dark-surface p-6">
          <p class="font-heading text-4xl text-dark-text">1399 zł</p>
          <p class="mt-1 text-sm text-dark-muted">
            Cena promocyjna · zaliczka 700 zł do 12.04.2026
          </p>
        </div>

        <!-- Regular price -->
        <div class="mt-4 rounded bg-dark-surface p-5 opacity-70">
          <p class="font-heading text-2xl text-dark-text">1500 zł</p>
          <p class="mt-1 text-sm text-dark-muted">Cena regularna</p>
        </div>

        <!-- Bank transfer details -->
        <div class="mt-6 rounded bg-dark-surface p-5">
          <p class="mb-2 text-sm font-bold text-accent">Dane do przelewu</p>
          <div class="space-y-1 text-sm leading-relaxed text-dark-muted">
            <p>Strus Company sp. z o.o.</p>
            <p>Nr konta: 11 1111 11111 1111 1111</p>
            <p>Tytuł: Imię Nazwisko - oboz mma - 23-26.04.2026</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify schedule section renders**

Run: `npm run dev`
Expected: Dark background. Left column: daily schedule with amber timestamps. Right column: two price cards (promotional with amber left border, regular muted), bank transfer details below. Two-column on desktop, stacked on mobile.

- [ ] **Step 3: Commit**

```bash
git add src/components/Schedule.astro
git commit -m "feat: implement schedule and pricing section with two-column layout"
```

---

### Task 6: Contact Form Component

**Files:**
- Rewrite: `src/components/ContactForm.astro`

- [ ] **Step 1: Rewrite ContactForm.astro**

Replace the full file content with:

```astro
---
const mailtoAddress = "kontakt@strus.net.pl";
---

<section id="contact" class="bg-warm-bg">
  <div class="mx-auto w-full max-w-6xl px-6 py-20">
    <div class="mx-auto max-w-md text-center">
      <p class="text-xs uppercase tracking-[0.3em] text-accent-dark">Formularz zgłoszeń</p>
      <h2 class="mt-2 font-heading text-[clamp(1.75rem,4vw,2.5rem)] uppercase text-warm-text">
        Zarezerwuj miejsce
      </h2>
    </div>

    <form
      id="registration-form"
      class="mx-auto mt-10 flex max-w-md flex-col gap-4"
      action={`mailto:${mailtoAddress}`}
      method="POST"
      enctype="text/plain"
    >
      <label class="grid gap-1.5 text-sm text-warm-text">
        <span class="font-medium">Imię <span class="text-accent-dark">*</span></span>
        <input
          type="text"
          name="imie"
          required
          class="rounded border border-warm-surface bg-white px-4 py-3 text-warm-text placeholder:text-warm-muted focus:border-accent focus:outline-none"
          placeholder="Jan"
        />
      </label>

      <label class="grid gap-1.5 text-sm text-warm-text">
        <span class="font-medium">Nazwisko <span class="text-accent-dark">*</span></span>
        <input
          type="text"
          name="nazwisko"
          required
          class="rounded border border-warm-surface bg-white px-4 py-3 text-warm-text placeholder:text-warm-muted focus:border-accent focus:outline-none"
          placeholder="Kowalski"
        />
      </label>

      <label class="grid gap-1.5 text-sm text-warm-text">
        <span class="font-medium">Nr telefonu <span class="text-accent-dark">*</span></span>
        <input
          type="tel"
          name="telefon"
          required
          class="rounded border border-warm-surface bg-white px-4 py-3 text-warm-text placeholder:text-warm-muted focus:border-accent focus:outline-none"
          placeholder="+48 600 000 000"
        />
      </label>

      <label class="grid gap-1.5 text-sm text-warm-text">
        <span class="font-medium">Współlokator <span class="text-warm-muted">(opcjonalnie)</span></span>
        <input
          type="text"
          name="wspolokator"
          class="rounded border border-warm-surface bg-white px-4 py-3 text-warm-text placeholder:text-warm-muted focus:border-accent focus:outline-none"
          placeholder="Imię i nazwisko"
        />
      </label>

      <label class="grid gap-1.5 text-sm text-warm-text">
        <span class="font-medium">Dodatkowa wiadomość</span>
        <textarea
          name="wiadomosc"
          rows="4"
          class="rounded border border-warm-surface bg-white px-4 py-3 text-warm-text placeholder:text-warm-muted focus:border-accent focus:outline-none"
          placeholder="Pytania, uwagi..."
        ></textarea>
      </label>

      <button
        type="submit"
        class="mt-2 w-full rounded bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-dark-bg transition-colors hover:bg-accent-dark"
      >
        Wyślij zgłoszenie
      </button>
    </form>
  </div>
</section>
```

- [ ] **Step 2: Verify form renders**

Run: `npm run dev`
Expected: Warm parchment background. Centered form with 5 fields (3 required, 2 optional). Labels above inputs. Full-width amber submit button. Inputs have warm-toned borders, focus state changes border to accent color.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactForm.astro
git commit -m "feat: implement registration form with mailto action on warm background"
```

---

### Task 7: Footer Component

**Files:**
- Rewrite: `src/components/Footer.astro`

- [ ] **Step 1: Rewrite Footer.astro**

Replace the full file content with:

```astro
<footer class="bg-dark-bg">
  <div class="mx-auto w-full max-w-6xl px-6 py-16 text-center">
    <p class="text-xs uppercase tracking-[0.3em] text-accent">Kontakt bezpośredni</p>
    <a href="tel:+48608052555" class="mt-3 block text-xl font-bold text-dark-text transition-colors hover:text-accent">
      +48 608 052 555
    </a>
    <p class="mt-2 text-sm text-dark-muted">Strus Company sp. z o.o.</p>

    <!-- Amber line motif -->
    <div class="mx-auto my-10 h-[3px] w-8 bg-dark-surface" aria-hidden="true"></div>

    <p class="text-xs text-dark-muted">
      © 2026 Sport Camp Piotr Strus. Wszelkie prawa zastrzeżone.
    </p>
  </div>
</footer>
```

- [ ] **Step 2: Verify footer renders**

Run: `npm run dev`
Expected: Dark background. Contact phone number as clickable link. Company name below. Subtle separator. Copyright at bottom. All centered.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: implement dark footer with contact info and copyright"
```

---

### Task 8: Final Polish & Verification

**Files:**
- Possibly adjust: any component for spacing/responsive issues

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build completes without errors or warnings.

- [ ] **Step 2: Preview built site**

```bash
npm run preview
```

Verify visually:
- Alternating dark/warm section rhythm is correct
- Amber line motif appears in: hero (below title), each feature card (bottom), pricing card (left border), footer section label
- All sections share consistent `max-w-6xl` content width
- Hero CTAs scroll to correct sections (#contact, #panorama)
- Form fields have correct types and validation
- Phone number in footer is a clickable `tel:` link
- Typography uses Bebas Neue for headings

- [ ] **Step 3: Test responsive breakpoints**

Check in browser devtools at:
- 320px (small mobile): single column, horizontal scroll cards, readable text
- 768px (tablet): schedule/pricing may start going two-column
- 1024px (desktop): full two-column layouts, all 4 feature cards visible in grid
- 1440px (wide): content stays centered within max-w-6xl

- [ ] **Step 4: Accessibility check**

- Verify all images have alt text (panorama bg is decorative — `aria-hidden="true"`)
- Verify form labels are properly associated with inputs
- Verify color contrast meets WCAG AA (dark-text on dark-bg, warm-text on warm-bg, accent on dark-bg)
- Verify focus states are visible

- [ ] **Step 5: Commit any adjustments**

```bash
git add -A
git commit -m "fix: final polish and responsive adjustments"
```

(Skip this commit if no changes were needed.)
