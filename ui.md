# Savitri — Master UI & Page Design Plan
### The complete design system: philosophy, palette, stack, illustration system, and all 18 individual pages

*This document merges the UI Implementation Plan and the Page-by-Page Design Plan into one file. Nothing from either source document has been dropped — where the two overlapped or one superseded the other, that history is called out explicitly rather than silently deleted, so both of you can see how a decision evolved, not just where it landed.*

---

## 0. The one decision that shapes everything else

Savitri actually has **two different frontends with two different design mandates**, and conflating them is the single biggest mistake we could make:

| | **The Ethereal Surface** | **The Farmer Surface** |
|---|---|---|
| Who sees it | Judges, investors, FPO admins, you | The actual smallholder farmer |
| Where it lives | The Next.js web app (marketing site + product app) | Telegram/WhatsApp voice & text |
| Design goal | Beautiful, cinematic, "designed by a 5-star studio" | Radically simple, large touch targets, voice-first, near-zero text |
| Why | This is where trust, funding, and "wow" get earned | The brief itself says: farmers have limited literacy and connectivity — an over-designed interface would actively fail them |

**Everything in this document, except where explicitly noted, is about the first one** — the web app. It's not wasted effort: this is what sells the vision, onboards FPOs, and is what you'll actually demo. But it's important to say out loud that this beauty is *for the people deciding whether to back Savitri*, not for the farmer in the field — that's the whole reason the farmer-facing side stays deliberately plain (see Section 9 for exactly how the two connect).

---

## 1. Design philosophy — tying the look back to the name

The brand isn't "generic agri-tech dashboard." It's **dawn breaking after a long night** — literally the Savitri story (walking through darkness beside Yama, arriving back at first light with a life saved). That single image should drive almost every visual decision:

- **The core motif is a gradient from deep night into warm dawn** — used in hero sections, section transitions, and loading states. Not a static gradient — one that *moves*, subtly, like the sun actually rising as you scroll or as data loads.
- **Light itself is a UI element.** Soft glows, gentle particle drift, warm highlight edges on cards — used sparingly, never as noise.
- **Grounded, not sterile.** Underneath the "ethereal" layer, this is still an agriculture product — so warm earth tones (terracotta, soil brown, leaf green) anchor the palette so it never drifts into generic sci-fi/crypto-startup territory.

---

## 2. Color palette

**Primary — the "dawn gradient" (used for hero backgrounds, primary CTAs, accents):**
- Deep Indigo Night `#1A1B3A` → Dusky Rose `#8B4A6B` → Amber Dawn `#E8925A` → Soft Gold `#F5C56E`

**Grounding / earth tones (used for content sections, cards, data):**
- Soil `#4A3728`, Terracotta `#C97B54`, Leaf `#5C7A5C`, Wheat `#E8DCC8`

**Dawn Mode (default theme):** a warm cream base `#FBF7F0` with the same accent gradient. This was a correction made mid-project: the very first draft of this plan defaulted to dark mode ("feels premium, lets the gradient glow"). Once real pastel artwork entered the picture, that stopped being right — pastels need a light, warm surface to breathe on, and a near-black background would flatten exactly the softness that makes hand-drawn work feel alive. Dawn Mode has been the documented default ever since.

**Neutral dark (optional alternate, toggle-only):**
- Near-black `#0E0E14`, Charcoal `#1C1C24`, Soft white text `#F5F3EF`
- Illustrations behave differently in this mode — see Section 6's dark-mode policy.

*Note: keep a strict WCAG AA contrast check on all text-on-gradient combinations — ethereal should never mean unreadable.*

---

## 3. Typography

- **Display/headlines:** a warm, editorial serif — **Fraunces** (free, variable, Google Fonts) — gives that "designed, not templated" feeling immediately. Used big, generous letter-spacing, in the hero and section titles.
- **Body/UI text:** **Inter** or **Geist** (free, excellent at small sizes, huge language support) for all functional text — dashboards, forms, data.
- **Vernacular support (non-negotiable):** **Noto Sans Devanagari** + relevant Noto Sans variants for other scripts, loaded via `next/font`, so any Hindi/regional-language content in the product (e.g. a preview of what the farmer sees in the bot) renders natively and beautifully, not as a fallback font.

---

## 4. The library stack (all free/open-source)

| Layer | Library | Why |
|---|---|---|
| Framework | **Next.js (App Router)**, React 19, TypeScript | As specified |
| Styling | **Tailwind CSS v4** | Industry standard, pairs with everything below |
| Base components | **shadcn/ui** | Accessible (Radix-based), unstyled-by-default so it takes our palette cleanly rather than fighting a pre-baked theme |
| Studio-quality blocks & dashboards | **Watermelon UI** (`ui.watermelon.sh`) | Real 2026 open-source, shadcn-compatible registry — 260–750+ components including full dashboard layouts, hero sections, bento grids; copy-paste so we own and can re-skin every component to the dawn palette |
| Hero/landing "wow" effects | **Aceternity UI** | Spotlight effects, glowing borders, 3D tilt cards, animated backgrounds — the "5-star studio" feel for the landing page hero, used around the real illustration, not instead of it |
| Marketing micro-interactions | **Magic UI** | Animated beams (great for literally drawing the data-flow architecture diagram *live* on the page), bento grids, animated counters (perfect for the researched stats: "10 lakh+ pumps", "15–20% post-harvest loss") |
| Text reveal / headline animation | **react-bits** | Blur-in, split-text, gradient-text effects for the hero headline — used once, tastefully, not on every heading |
| Animation engine | **Motion** (the current name for Framer Motion) | Powers Watermelon/Aceternity/Magic UI under the hood; also used directly for card hover states, page transitions |
| Cinematic scroll storytelling | **Lenis** + **GSAP ScrollTrigger** | For the Story page's "walk through the night into dawn" scroll experience — Lenis smooths the scroll itself, GSAP times the gradient/content and illustration reveals to scroll position |
| Ambient depth (fallback only, not primary) | **React Three Fiber** + drei | Originally planned as the hero background itself. Now that real pastel art exists (Section 6), the painted illustration *is* the hero — R3F is kept only as a contingency for a page/moment with no matching artwork yet, or as a very subtle secondary layer (e.g. a faint drifting-light overlay *behind* the illustration, opacity ≤10%), never competing with the art for attention |
| Image optimization | **`next/image`** + **Sharp** (build-time) | Every illustration is a real, heavy raster file (3000px+ source) — non-negotiable for performance. See Section 6 for the specific budget and settings |
| Icons | **Lucide** | Ships with shadcn, used for all *utilitarian* small icons; the 5 hand-drawn motif icons replace Lucide only at the specific "signature" spots named per-page below |
| Charts (price trends, water savings) | **Tremor** or **Recharts** | Restyled to the earth/dawn palette — no default blue/green chart colors |
| Maps (field boundaries, cold storage) | **Leaflet** + `react-leaflet` | Free, open-source, fully restyleable tile theme (muted earth tones instead of default garish map colors) |
| Forms | **react-hook-form** + **zod** | Standard, robust validation |
| Data fetching/cache | **TanStack Query** | Clean handling of the real API calls from the FastAPI backend |
| State (light, global UI state only) | **Zustand** | Simple, no boilerplate |

**A rule to keep this from becoming a kitchen sink:** Watermelon UI + shadcn are the *foundation* for 90% of the app (dashboards, forms, tables, cards). Aceternity + Magic UI + react-bits are used *only* on the landing/hero and a few signature moments (the architecture diagram reveal, the stat counters, the Story page scroll section) — never on functional dashboard screens, where speed and clarity matter more than flourish. The hand-drawn illustrations occupy the role originally given to the Three.js particle field — they are the primary "wow," not an addition on top of it.

---

## 5. Site Map — all 18 pages

**Marketing site (public, no login):**
1. Home
2. The Story (About)
3. How It Works
4. For Farmers
5. For FPOs & Partners
6. Impact & Data
7. Get Started / Contact

**Product app (post-login, primarily FPO/operator-facing — see Section 0 on why real farmers live on Telegram/WhatsApp instead):**
8. Dashboard Home (overview only — not a dumping ground)
9. Irrigation
10. Crop Health
11. Harvest Timing (Spoilage-Risk)
12. Cold Storage Booking
13. Market: Sell or Store
14. Second Income (Agrivoltaics)
15. Climate & Insurance
16. My Farm (field/profile/settings)

**Operator/admin-only views (denser, power-user screens — distinct from the farmer-facing pages above):**
17. Facility Allocation View (cold-storage operator side)

Eighteen pages, each with one job. Nothing below tries to hold more than 3–4 pieces of information at a time.

**A design decision worth documenting rather than hiding:** the very first draft of this plan proposed a single dense "Main Dashboard" page — a bento grid holding all nine feature layers at once (irrigation, spoilage-risk, cold storage, market, agrivoltaics, and climate all as simultaneous cards). That idea was deliberately abandoned in favor of the thin Dashboard Home (page 8) plus one dedicated page per feature (9–15) — the congestion that design was trying to avoid is exactly what a nine-card bento grid would have caused. The bento-grid *pattern* itself wasn't wasted, though — Watermelon UI's bento component is still used, just for smaller, genuinely-related groupings within individual pages, not as the whole dashboard's structure.

---

# MARKETING SITE

## 1. Home
**Job:** first impression — beautiful, clear in 10 seconds what this is.
- **Hero:** Art Brief piece **A5** ("The return of light") as the full-bleed background — the actual painted sunrise illustration. Warm cream/dawn gradient bleeding into its edges so it doesn't look like a pasted sticker. Headline in Fraunces, large, restrained, positioned over the calmer sky area of the illustration (not over the figure): *"Savitri walks beside every harvest, and brings it back."* One CTA button only ("See how it works"). If A5 isn't ready yet, the fallback is the plain dawn-gradient background alone — never a substitute animation pretending to be the real thing.
- **Below the fold:** three-card row (shadcn/Watermelon cards) — one per audience: Farmers / FPOs & Partners / Investors — each just a line and a link to its own dedicated page. This is the "don't congest" principle in action: Home *routes*, it doesn't explain everything itself.
- **Stat strip:** 3 animated counters (Magic UI), real researched numbers only (10 lakh+ pumps, 15–20% loss, ₹1.5/kg vs ₹3.7/kg) — small, quiet, not the hero of the page.
- No dashboard previews here — that belongs on "How It Works."

## 2. The Story (About)
**Job:** hold the *why*. This page can be slow and cinematic — it's not meant to convert quickly, it's meant to be remembered.
- Lenis + GSAP scroll: the 3–5 myth-beat illustrations (Art Brief A1–A5) appear one at a time as the user scrolls, background gradient shifting from dusk to dawn tones alongside them.
- Each illustration paired with one short caption line — the myth beat on one side, in italics, and how it maps to the product on the other (e.g. "She did not fight Death, she walked beside him" / "Savitri doesn't stop a crop from being at risk — it walks the last mile with the farmer until it's safe.").
- Ends with a simple text section: what Savitri means as a word, why the name was chosen, one paragraph, no images — let it land quietly.

## 3. How It Works
**Job:** the technical credibility page — this is what judges and technical partners actually want.
- The Magic UI animated-beam diagram (satellite/weather → decision engine → farmer) lives here, not on Home — it's a "how," not a "what."
- Below it, a simple 4-column layout (not a bento grid) walking through the four pillars (energy/water, post-harvest loss, empowerment, climate resilience), each with a small motif icon (B3 droplet, B4 harvest basket, B2 sprout, B1 sun) and one real cited number.
- A collapsible "read the full architecture" section for anyone who wants the depth (links out to or embeds a simplified version of the Build Plan).

## 4. For Farmers
**Job:** show, don't sell. This page should feel calm, not like marketing copy.
- Dominated by the phone-mockup component (the same "Chat/Voice Preview" component originally scoped as its own screen — see the note at the end of Section 8) — an actual realistic Telegram conversation, exactly as a farmer would see it, in a real regional language with an English toggle.
- B1 (the dawn/sun motif) shown as the bot's avatar right inside the mockup, so the visitor sees the same small thread of identity a real farmer would.
- No dashboards, no jargon, no stat walls on this page — the farmer's whole experience is this simple, and the page should *demonstrate* that by also being simple.

## 5. For FPOs & Partners
**Job:** the business case.
- A comparison layout (not a bento grid — a clean 2-column or table): "Before Savitri / With Savitri" for cold-storage utilization, advisory reach, income impact — using real cited benchmarks (DeHaat's 50–70%, ColdHubs' 80% spoilage cut) as *reference points*, clearly labelled as industry benchmarks, not promises.
- Business model section (three options — pay-per-use, bundled with financing/inputs, or B2B2Farmer licensing) presented as three simple option cards, since this is still an open decision — honest, not oversold.

## 6. Impact & Data
**Job:** the receipts. One page, dense with real numbers, built for anyone who wants to fact-check.
- A clean data table or card grid of every cited statistic from the research (post-harvest loss baselines, water savings %, cold-storage cost comparisons, agrivoltaics tariffs), each with its source named inline.
- This page is intentionally the least "designed" page on the site — plain, credible, Inter/Geist typography throughout, minimal color, **no illustration at all** (a deliberate exclusion, not an oversight — see Section 6). Judges reward a page like this precisely because it doesn't try to dazzle.

## 7. Get Started / Contact
**Job:** simple form, nothing more. Name, role (farmer / FPO / partner / investor), message. No illustration needed here — let the previous six pages have done their job.

---

# PRODUCT APP (post-login)

## 8. Dashboard Home
**Job:** orientation, not information overload. This is the page most tempted to become "everything congested" — resist that (see the Section 5 note on why the original bento-grid concept was abandoned here specifically).
- Just **one large card**: today's single most urgent recommendation across all modules (whichever of irrigation/spoilage/storage/market is most time-sensitive right now), plus a simple row of 6 icon-links (using the motif set at small size) to the six functional pages below.
- Think of this page as a table of contents with one headline story, not a bento grid of nine widgets.

## 9. Irrigation
**Job:** everything about water, in one place.
- Today's recommendation, large, at the top (the same card style as Dashboard Home, now with full detail: the actual ET₀/Kc numbers behind it, shown in a clean expandable "why" section — real transparency, not a black box).
- A 7-day forecast strip below (Open-Meteo data), and a simple historical log of past recommendations vs. what the farmer actually did (once RMS/pump-data feedback exists).
- B3 (water droplet motif) as the page's quiet visual anchor, top corner — not a full illustration, just enough to feel branded.

## 10. Crop Health
**Job:** photo diagnosis + regional awareness.
- Upload/photo capture front and center (large, obvious button — this page will often be used one-handed on a phone).
- Result card below with the model's diagnosis and confidence, styled plainly and honestly (if the model isn't confident, say so).
- A small regional map (Leaflet) underneath showing anonymized recent diagnoses nearby — the "proactive warning" feature made visible.

## 11. Harvest Timing (Spoilage-Risk)
**Job:** "The Walk" — the emotional core feature gets its own page, not a cramped card.
- The gentle fade-to-bloom gradient bar as the full-width centerpiece, showing the crop's real trajectory over the coming days — same emotional beat as the myth, expressed through color and shape rather than literal imagery.
- A simple, plain-language explanation underneath of *why* the risk is what it is (heat forecast, days since a certain growth stage, etc.) — same "explain the why" principle as Irrigation.
- One clear call-to-action button: "Find storage now" → routes to page 12.

## 12. Cold Storage Booking
**Job:** the marketplace, farmer/FPO-staff side.
- Full Leaflet map, real facility pins, real live capacity shown as a simple fill-bar per pin (not a number the farmer has to parse).
- Booking flow is a simple 3-step form (react-hook-form): choose facility → choose slot → confirm. No modal stacking, no clutter.
- A small "your basket" motif icon marks confirmed bookings in a simple list below the map.
- *Distinct from page 17*, which is the facility operator's side of the same system.

## 13. Market: Sell or Store
**Job:** one number, well-supported.
- The headline number ("store 3 more days → ~₹X/kg more") sits at the top, large, exactly like a stat you'd see on a finance app — because that's effectively what this is.
- The Tremor/Recharts price trend chart below it, with the recommended action point highlighted.
- B4 (grain basket motif) as the page's icon.

## 14. Second Income (Agrivoltaics)
**Job:** the forward-looking, optional feature — deliberately lower-key than the daily-use pages.
- A simple calculator: land area input → real state tariff rate → projected annual income, shown as a single clear result, with the source/scheme cited directly beneath it.
- Art Brief piece **C1** (the agrivoltaics cross-section illustration: raised solar panel with shade-tolerant crops beneath) — a natural place for a real illustration, since the concept itself is visual and slightly unfamiliar to explain in text alone.

## 15. Climate & Insurance
**Job:** seasonal, lower-frequency page — a risk badge, not a daily dashboard.
- A simple seasonal risk indicator (low/medium/high, plainly labelled, not a scary gauge) plus 2–3 lines of what it means for crop choice this season.
- A single link/nudge toward PMFBY insurance information when risk is elevated — not pushy, just present.

## 16. My Farm
**Job:** the settings/profile page every app needs, kept boring on purpose.
- Field boundary map (editable), crop selection, language preference, notification channel (Telegram/WhatsApp) toggle. Standard shadcn form components throughout — **no special art, no animation** (a deliberate exclusion, alongside page 6 — see Section 6). This page should feel like the calmest room in the house.

**A note on the "Auth / Onboarding" screen from the earlier UI plan draft:** this was originally scoped as its own numbered screen — a minimal, centered glass-morphic card over a soft dawn-gradient background, with the language picker shown as a horizontal row of native-script labels (हिंदी, தமிழ், मराठी...) rather than an English dropdown, and field-boundary setup done via a Leaflet map restyled with muted earth-tone tiles and a soft glowing polygon-draw tool. That content hasn't been dropped — it lives as the entry flow *into* the product app (before page 8), and the field-boundary-drawing part of it is the same interaction later reused on page 16 (My Farm) for editing.

**A note on "Chat/Voice Preview":** the earlier UI plan scoped this as its own screen, described as "a realistic phone-frame component showing exactly what the farmer sees/hears — chat bubbles, a waveform icon for voice notes — built for pitching, not for farmer use." That component is real and still needed, but it isn't a standalone page in the final sitemap — it's embedded directly into page 4 (For Farmers), and can be reused as a standalone pitch/demo asset outside the app entirely (e.g. dropped into a pitch deck) without needing its own route.

---

# OPERATOR / ADMIN-ONLY VIEWS

## 17. Facility Allocation View
**Job:** the cold-storage operator's side of the marketplace — distinct from the farmer/FPO-staff booking flow on page 12.
- A calendar/timeline visualization of real bookings against real facility capacity, using a restyled Watermelon UI dashboard table.
- A small Leaflet inset map showing the facility's location and, if the operator manages multiple sites, all of them at once.
- This is the one screen in the whole app allowed to be denser than the "one job per page" rule elsewhere — an operator managing a facility genuinely needs an at-a-glance capacity view, not a simplified single-purpose page. Kept visually plain (Inter/Geist, no illustration, minimal color) for the same reason pages 6 and 16 are plain: this is a working tool, not a showcase moment.

---

## 6. The illustration system

Rather than a single hero banner, Savitri's pastel artwork is treated as a small *family* of assets (full prompt-level detail lives in the separate Art Brief document; this section covers how they're used and handled technically):

1. **5 sequential "myth-beat" illustrations (A1–A5)** — Savitri setting out, the vigil, Yama's arrival, the walk, the return of light — used on the Story page (page 2) and, for A5 specifically, the Home page hero (page 1).
2. **5 recurring motif icons (B1–B5)** — dawn/sun, sprout, water droplet, grain basket, solar-panel-with-sprout — small enough to work as icons, used across the product app at specific "signature" spots only (named per-page above), never scattered decoratively.
3. **2 page-specific illustrations (C1–C2)** — the agrivoltaics cross-section (page 14) and the seed/loading empty-state image (used wherever any dashboard page has no data yet).

**Export format:** high-resolution, transparent-background PNG/WebP (at least 3000px on the long edge) so the art composites over gradients without a boxy background. A couple of the simplest motifs are also traced as clean SVGs for icon-sized use — crisp at any size, tiny file weight.

**Deliberately excluded pages — a decision, not an oversight:** Impact & Data (page 6) and My Farm (page 16) carry no illustration at all. Both are working/reference pages where art would compete with the plainness that makes them credible and calm, respectively.

**Dark mode policy for illustrations:** pastel art was painted for a warm, light background and will look muddy or flattened against near-black. Rather than pretend the art "just works" in both themes:
- In **Dawn Mode** (default): illustrations render at full color, full opacity, exactly as painted.
- In **dark mode** (optional alternate): illustrations render inside a card with a soft warm-toned surface behind them (`#FBF7F0` at ~90% opacity — a small "window" of dawn light around the art) rather than sitting directly on the dark background. This preserves the art's actual colors instead of trying to re-tint pastel work programmatically, which never looks right.

**Technical handling (so 3000px pastel scans don't wreck load times):**
- Every illustration ships through `next/image` with an explicit `sizes` prop and a low-res blur placeholder (`placeholder="blur"`, generated at build time via Sharp) — the hero piece (A5) should never cause a layout jump or a blank flash while it loads.
- Web-facing exports are WebP, targeting under 300KB per hero-sized image and under 60KB per motif icon after compression. The original high-res PNG/pastel scan stays in a source design archive, never shipped to the browser directly.
- Because the myth-beat sequence (A1–A5) only appears on two pages (Home hero, Story page), lazy-load everything except the one hero image that's above the fold on first paint.

**Accessibility (non-negotiable given who this product is ultimately for):**
- A1–A5 carry real, written alt text describing the *narrative* moment, not just "illustration of two figures" — e.g. A5's alt text should convey "a figure standing on a hill at sunrise, having brought light back after a long night," so a screen-reader user gets the same emotional beat as a sighted one.
- B1–B5, when purely decorative (e.g. a page-corner mark), get `alt=""` and `aria-hidden="true"`; when B1 functions as the bot's avatar (the only identifier for who's speaking), it gets real alt text ("Savitri").
- C2 (empty state) gets alt text matching its calm, patient tone ("a seed resting in soil, not yet sprouted") — small detail, but it means even a loading state doesn't feel like an error to someone using a screen reader.

---

## 7. How the two surfaces connect (so this doesn't feel like two products)

The dawn gradient, the Savitri name, and the core icon language (sun, gentle bloom shapes) appear — *minimally* — even in the plain Telegram/WhatsApp experience: B1 (the dawn/sun motif) as the bot's avatar, and a one-line closing signature on voice messages ("— Savitri"). That's the entire budget of "design" spent on the farmer surface, and it's intentional: consistency of brand, zero cost to usability.

---

## 8. Motion design rules (so animation stays classy, not noisy)

- **One signature easing curve** used everywhere for consistency — a soft "sunrise" cubic-bezier (gentle acceleration, gentle settle), not a bouncy/springy default.
- **Hover/interaction animations:** 150–250ms, never longer — dashboards must feel fast.
- **Scroll-triggered/story animations:** reserved for the Story page (page 2) only.
- **Always respect `prefers-reduced-motion`** — every Motion/GSAP/Three.js effect needs a static fallback. This isn't optional polish; it's accessibility, and it matters more, not less, for a product that cares this much about inclusion.

---

## 9. Directory structure

```
frontend/
├── app/
│   ├── (marketing)/                 # pages 1–7
│   │   ├── page.tsx                 # Home
│   │   ├── story/
│   │   ├── how-it-works/
│   │   ├── for-farmers/
│   │   ├── for-partners/
│   │   ├── impact/
│   │   └── contact/
│   ├── (dashboard)/                 # pages 8–16
│   │   ├── page.tsx                 # Dashboard Home
│   │   ├── irrigation/
│   │   ├── crop-health/
│   │   ├── harvest-timing/
│   │   ├── cold-storage/
│   │   ├── market/
│   │   ├── second-income/
│   │   ├── climate/
│   │   └── my-farm/
│   ├── (operator)/                  # page 17
│   │   └── allocation/
│   └── (auth)/                      # onboarding, incl. field-boundary setup
├── components/
│   ├── ui/                          # shadcn + Watermelon UI base components
│   ├── motion/                      # Aceternity/Magic UI/react-bits pieces, isolated
│   │   ├── ParticleField.tsx        # R3F — fallback only, see Section 4
│   │   ├── AnimatedBeamDiagram.tsx  # the architecture-diagram reveal
│   │   └── StatCounter.tsx
│   ├── illustration/                # the hand-drawn art system, isolated like motion/ is
│   │   ├── MythBeat.tsx             # renders one A1–A5 piece + its themed alt text
│   │   ├── MotifIcon.tsx            # renders one B1–B5 icon at the approved sizes/spots
│   │   └── EmptyState.tsx           # wraps C2 for the shared empty-state pattern
│   ├── dashboard/
│   │   ├── IrrigationCard.tsx
│   │   ├── SpoilageRiskCard.tsx     # "The Walk"
│   │   ├── ColdStorageMap.tsx
│   │   ├── PriceTrendChart.tsx
│   │   └── AgrivoltaicsCard.tsx     # includes C1
│   ├── operator/
│   │   └── AllocationCalendar.tsx   # page 17
│   └── phone-preview/
│       └── ChatMockup.tsx           # bot avatar uses B1; embedded in For Farmers page
├── public/
│   └── art/                         # web-optimized WebP exports only — see Section 6
│       ├── myth-beat-a1.webp … a5.webp
│       ├── motif-b1-dawn.webp … b5-second-income.webp
│       ├── agrivoltaics-c1.webp
│       └── empty-state-c2.webp
├── styles/
│   └── tokens.css                   # the dawn palette as CSS variables, referenced everywhere
└── lib/
    └── motion-presets.ts            # the one shared easing curve + durations

# NOTE: original high-resolution scans/source files (pastel originals, layered
# Procreate/Photoshop files) are kept OUTSIDE this repo in a separate design
# archive — only compressed, web-ready exports belong in public/art/.
```

---

## 10. How this avoids the "congested" trap

Every page above answers exactly one question a farmer or FPO operator would actually ask on a given day ("should I water," "is my crop sick," "will this rot," "where do I store it," "sell or wait," "should I add solar," "what's the season looking like," "what are my details," "how full are my facilities"). Nothing appears on two pages except the single "most urgent item" surfaced on Dashboard Home as a way *in* to the right page — never as a duplicate of the full page itself.

---

## 11. What's left after this

Five documents now exist: the README (naming/story, features, research), the Build Plan (backend, real data sources, zero-mock policy), this Master Plan (screens, stack, illustration system, and all 18 pages), and the Art Brief (all 12 illustrations as ready-to-draw prompts). Between them: what it's called and why, what it does, how it's technically built, what it looks like on every single page, and exactly what needs to be drawn.

The remaining work is execution on two tracks that can genuinely run in parallel: Phase 1 of the Build Plan (real weather → real irrigation number) on the code side, and the B1–B5 motif icons on the art side, since both are the smallest, fastest, most-reused pieces of their respective tracks — good first wins before tackling anything bigger.