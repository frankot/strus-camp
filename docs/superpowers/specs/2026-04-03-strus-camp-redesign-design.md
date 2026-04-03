# Strus Camp — Website Redesign Design Spec

## Context

The current strus.net.pl is a generic AI-generated one-pager promoting Piotr Strus's 4-day MMA/mountain sport camp in Zakopane. It works but looks like templated slop with no personality. The redesign must feel like the experience itself — raw Tatry mountains meets combat sports discipline. Strong, minimal, memorable.

## Design Identity: "The Amber Line"

The site's signature motif is a **single amber/orange accent line** — a 3px horizontal rule that recurs throughout the page as a visual thread. It appears under the hero title, at the bottom of each feature card, beside pricing, and in section labels. This thin amber thread ties the entire page together and gives it a distinctive, recognizable character. It evokes both a mountain ridgeline and the discipline of martial arts (a belt, a stripe).

Combined with the **alternating dark/warm section rhythm**, the amber line creates a page that breathes — heavy, then light, heavy, then light — like rounds in a fight or valleys between peaks.

## Tech Stack

- **Astro 6** (static, no JS frameworks)
- **Tailwind CSS v4** via Vite plugin (already configured)
- **Pure Astro components** — no React/Vue/Svelte
- **HTML lang="pl"**

## Color Palette

### Dark Sections (Hero, Schedule/Pricing, Footer)
| Role       | Color   | Usage                        |
|------------|---------|------------------------------|
| Background | #1a1714 | Warm charcoal (not pure black) |
| Surface    | #262220 | Cards, elevated elements      |
| Text       | #f5f0e8 | Primary text on dark          |
| Muted      | #a8a29e | Secondary text, labels        |

### Warm Sections (Panorama overlay, Form)
| Role       | Color   | Usage                        |
|------------|---------|------------------------------|
| Background | #f5f0e8 | Stone/parchment              |
| Surface    | #e8dfd2 | Cards, form field borders     |
| Text       | #1c1917 | Primary text on warm          |
| Muted      | #78716c | Secondary text               |

### Accent (Both contexts)
| Role          | Color   | Usage                            |
|---------------|---------|----------------------------------|
| Primary       | #d97706 | CTAs, labels, amber line motif   |
| Dark variant  | #b45309 | Hover states, warm section labels |

## Typography

- **Headings**: System font stack or Bebas Neue (from current site) — bold, uppercase, tight letter-spacing
- **Body**: System font stack or Satoshi — clean, readable
- **Sizing**: Fluid with `clamp()` — hero title ~4-5rem desktop, ~2.5rem mobile
- **Character**: Uppercase labels with wide letter-spacing for section markers. Heavy weight headings. Restrained body text.

## Page Structure

All sections share a consistent `max-w-6xl` content width, centered.

### 1. Hero (Dark)
- Full viewport height or close to it
- Top: small label "Piotr Strus zaprasza" in muted uppercase
- Center: **massive "SPORT CAMP" title** — the biggest text on the page
- **Amber line** (3px, ~50px wide) below title
- Below: "Tatry · 23–26 Kwietnia 2026"
- **Background**: subtle photo of Piotr Strus or mountain scene with heavy dark overlay (the photo adds texture without competing with text). If no photo available at build time, use a subtle gradient or grain texture.
- Two CTA buttons:
  - "Zapisz się" — filled amber, scrolls to form
  - "Szczegóły" — ghost/outlined, scrolls to about section
- Quick facts row at bottom: date, location, price — small, factual

### 2. Panorama + Features (Warm cards on fixed mountain background)
- **Tatras panorama photo** as `background-attachment: fixed` (parallax effect)
- Semi-transparent dark overlay (#1a1714 at ~55% opacity) for readability
- Section label: "Co zawiera obóz" in amber uppercase
- Heading: "4 dni, które zapamiętasz"
- **Horizontally scrollable cards** overlaying the panorama:
  - 4 cards: Treningi, Góry, Zakwaterowanie, Wyżywienie
  - Frosted glass style: `rgba(245,240,232,0.95)` background with `backdrop-filter: blur(8px)`
  - Each card: bold title, short description, amber line at bottom (the motif)
  - On desktop (lg+): all 4 cards visible in a row
  - On mobile: horizontal scroll with snap behavior
- Note: `background-attachment: fixed` doesn't work on iOS Safari — use a CSS-only fallback (static background position)

### 3. Schedule + Pricing (Dark)
- Two-column layout (stacks on mobile):
  - **Left — Plan dnia**: Time-based schedule with amber-colored timestamps
    - 07:00 Rozruch
    - 08:00 Śniadanie
    - 09:30 Wyjście w góry
    - 13:00 Obiad
    - 15:00 Trening sportów walki
    - 19:00 Kolacja
  - **Right — Cena i wpłata**:
    - Promotional price card: 1399 zł with amber left border, "zaliczka 700 zł do 12.04" note
    - Regular price card: 1500 zł, slightly muted
    - Bank transfer details box: Strus Company sp. z o.o., account number, transfer title format

### 4. Registration Form (Warm)
- Centered, max-width ~450px
- Section label: "Formularz zgłoszeń" in amber
- Heading: "Zarezerwuj miejsce"
- Fields (matching original site):
  - Imię (required)
  - Nazwisko (required)
  - Nr telefonu (required)
  - Współlokator — imię i nazwisko (optional)
  - Dodatkowa wiadomość (textarea, optional)
- Submit button: full-width amber, "Wyślij zgłoszenie"
- Form action: mailto-based (as current site) — can be swapped to Formspree/Web3Forms later
- Brief note below form about data handling

### 5. Contact + Footer (Dark)
- "Kontakt bezpośredni" label in amber
- Phone: +48 608 052 555 (prominent, clickable `tel:` link)
- Company: Strus Company sp. z o.o.
- Subtle separator
- Copyright: © 2026 Sport Camp Piotr Strus

## Responsive Behavior

- **Desktop (lg, 1024px+)**: Full two-column layouts, all feature cards visible
- **Tablet (md, 768px+)**: Two-column for schedule/pricing, feature cards may need scroll
- **Mobile (<768px)**: Single column throughout. Feature cards horizontal scroll with snap. Hero title scales down via clamp(). Form goes full-width with padding.

## Interactions & Micro-details

- Smooth scroll for anchor links (already in global CSS)
- Subtle hover on CTA buttons (slight brightness/scale)
- No animations on scroll — keep it fast and simple
- Form validation: HTML5 native (required, type="tel")
- No dark mode toggle — the page IS the dark mode experience with warm contrast sections

## Assets Required

- **Tatras panorama photo** (horizontal, high-res) — provided by user later
- **Hero background photo** (Piotr Strus or mountain scene) — optional, can use texture/gradient fallback
- Favicon: keep existing

## What We're NOT Building

- No navbar / navigation bar
- No dark mode toggle
- No JavaScript frameworks (React, Vue, etc.)
- No CMS integration
- No analytics (can add later)
- No cookie banner
- No multi-page routing
- No image gallery or carousel beyond the feature cards scroll

## Verification

1. Run `npm run dev` and verify all sections render correctly
2. Check alternating dark/warm rhythm visually
3. Test horizontal scroll cards on mobile viewport
4. Verify all anchor links (Zapisz się → form, Szczegóły → panorama section)
5. Test form submission (mailto action)
6. Check responsive breakpoints at 320px, 768px, 1024px, 1440px
7. Validate amber line motif appears consistently across sections
8. Lighthouse check: performance, accessibility scores
