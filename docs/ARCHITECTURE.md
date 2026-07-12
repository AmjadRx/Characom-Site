# CHARACOM GROUP — Website Architecture Specification

**For:** Claude Code (implementation agent) · **No code in this document — build to spec.**
**Deliverable:** Ultra-premium, cinematic, fully animated marketing site + full self-serve admin CMS.
**Stack decision (locked):** Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion + GSAP ScrollTrigger · Lenis · Supabase · Vercel · GitHub.
**Direct competitor to beat:** https://www.cyfieldgroup.com/

---

## 1. Competitive Brief — How Characom Beats Cyfield

Cyfield's site (audited July 2026) is a WordPress/WPML build. What they have:

- Three sectors (Real Estate Development, Construction Contracting, Energy) with mega-menus.
- Animated stat counters (5k+ customers, 400+ developments, 700+ employees, 620+ km of roads/sewerage, 5 offices).
- Property search with filters, news feed, regions map, "Become a Partner" form, awards badges, EN/RU locales.

Their weaknesses — our attack surface:

1. **Dated visual language.** Generic WordPress theme, flat white layout, no motion identity. Characom will feel like a film title sequence by comparison.
2. **Performance.** Heavy WP plugin stack, huge DOM, render-blocking assets. Characom targets sub-2s LCP on a static-first Next.js build.
3. **Cluttered IA.** Triple-nested mega-menus and duplicated nav blocks. Characom uses a focused 5–6 item nav with a full-screen menu overlay.
4. **Accessibility failures.** They set `maximum-scale=1, user-scalable=no` (blocks zoom). Characom ships WCAG 2.1 AA.
5. **No editorial storytelling.** Their project pages are listings. Characom project pages are cinematic case studies (full-bleed imagery, parallax, spec sheets, next-project flow).
6. **Static content ops.** Characom's admin edits everything live without a developer.

**Must match or exceed:** stat counters, category-driven project browsing, news section, multi-office contact, partner inquiry capture, awards/trust signals, multilingual readiness.

---

## 2. Technology Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15+, App Router, TypeScript strict | React (as required), SEO-grade SSR/SSG, first-class on Vercel |
| Styling | Tailwind CSS v4 + CSS custom-property design tokens | Fast iteration; tokens make the whole skin admin-tunable later |
| Animation (micro/layout) | Framer Motion | Enter/exit, layout animations, page transitions, hover states, AnimatePresence |
| Animation (scroll/cinematic) | GSAP 3 + ScrollTrigger + SplitText-equivalent (SplitType, free) | Scrubbed timelines, pinning, parallax, counters, line-by-line text reveals |
| Smooth scroll | Lenis, synced to GSAP ticker | Buttery inertial scroll; single RAF loop shared with GSAP |
| Backend / CMS | Supabase (Postgres + Auth + Storage + RLS) | Free tier, pairs natively with Vercel, powers the custom /admin |
| Forms/email | Supabase insert + Resend (or Vercel email integration) for notifications | Inquiries stored AND emailed |
| Images | next/image + Supabase Storage, AVIF/WebP | Automatic optimization, blur placeholders |
| Data fetching (admin) | TanStack Query + react-hook-form + Zod | Robust CRUD UX with validation |
| Hosting | Vercel (production + preview deployments) | Per user's requirement |
| Source control | GitHub, `main` = production, PR previews | Per user's requirement |

**Rendering strategy:** Public pages are statically generated with **ISR + on-demand revalidation**. When an admin clicks Publish, a Supabase webhook (or server action) calls Next's revalidate API → the live site updates within seconds, no redeploy. Admin routes are client-rendered behind auth, excluded from indexing.

**Framer Motion vs GSAP — ownership rule (prevents jank and conflicts):** every animated element has exactly ONE owner. Framer Motion owns component lifecycle animation (mount/unmount, hover, tap, layout, page transitions). GSAP owns scroll-linked animation (ScrollTrigger scenes, pins, scrubs, counters, split-text reveals, parallax). Never attach both to the same DOM node.

---

## 3. Design System — "Cyprus Modern"

Identity: the copper-gold of the Cyprus flag, the green of its olive branches, and Mediterranean blue — on a bright, gallery-white canvas with deep-ink cinematic sections for contrast.

### 3.1 Color tokens

| Token | Hex | Role |
|---|---|---|
| `--plaster` | #F7F5F0 | Primary background (warm gallery white) |
| `--white` | #FFFFFF | Cards, elevated surfaces |
| `--ink` | #0E1216 | Dark cinematic sections, footer, text on light |
| `--ink-soft` | #1A2129 | Dark section surfaces |
| `--gold` | #C8912D | PRIMARY accent — CTAs, counters, active states (Cyprus copper) |
| `--gold-bright` | #E3B75C | Gradients, glows, hover states on dark |
| `--gold-deep` | #9A6E1B | Gold used AS TEXT on light backgrounds (AA contrast) |
| `--cypress` | #2F5D46 | Secondary — Government/Infrastructure category theme, sustainability |
| `--aegean` | #1B5D7D | Tertiary — Real Estate category theme, links on light |
| `--stone` | #8A8577 | Muted text, dividers, kickers |

**Discipline rules (this is what makes it premium, not rainbow):**
- Any single viewport shows **one accent color** dominant — gold by default.
- Green and blue exist as **category theming** in the Portfolio (Government = cypress, Real Estate = aegean, Residential = gold) and as small semantic touches. Each portfolio category page tints its glows, underlines, and counters to its theme color.
- Dark `--ink` sections alternate with `--plaster` sections down every page for cinematic rhythm.
- Gold text on white must use `--gold-deep`; gold on ink may use `--gold`/`--gold-bright`. Never light gold on white.
- A 2–3% opacity film-grain/noise overlay sits on dark sections; subtle radial gold gradient meshes may back hero/CTA sections.

### 3.2 Typography

- **Display:** Space Grotesk (or Clash Display if licensing is arranged) — headlines, counters, nav. Tight tracking, weights 500–700.
- **Body:** Inter — paragraphs, UI, forms. Weights 400–600.
- **Kickers:** 12–13px uppercase, +0.18em letter-spacing, `--stone` or accent color, preceded by a 24px animated rule line.
- **Fluid scale via clamp():** display-1 ~ clamp(2.75rem → 6.5rem), display-2 ~ clamp(2rem → 4rem), h3 ~ clamp(1.4rem → 2rem), body 1rem–1.125rem, generous 1.6–1.7 body line-height, 1.02–1.08 display line-height.
- Load via `next/font` (self-hosted, zero layout shift).

### 3.3 Spatial & surface tokens

- Section vertical padding: clamp(5rem → 9rem). 12-column grid, max-width 1440px, 24/48px gutters. Generous negative space is mandatory.
- Radii: 4px (inputs), 12px (cards), 999px (pills/morphing buttons).
- Shadows: soft ambient only; on dark sections use **accent glow** (large blurred accent-colored shadow at low opacity) instead of gray shadows.
- Borders on dark: 1px white at 8–12% opacity.

### 3.4 Signature component behaviors

- **MorphButton:** pill CTA; on hover a gold wipe fills from the left and border-radius animates (square ⇄ full pill); subtle magnetic pull toward cursor (desktop only, ±8px, spring). On click: quick scale-down 0.97 → overshoot.
- **TiltCard:** project/feature cards tilt in 3D toward the cursor (max 6°, perspective 900px, spring back on leave) with a cursor-following radial glow in the card's theme color and a slow image scale (1 → 1.06).
- **Counter:** number counts from 0 when scrolled into view (GSAP, once), with the "+" suffix popping in after; tabular-nums to prevent width jitter.
- **SplitTextReveal:** headlines split into lines (SplitType), each line masked and translated up 110% → 0 with stagger 0.08s, ease `power4.out`, triggered at 75% viewport.
- **Custom cursor (desktop only):** small dot + trailing ring; ring expands with "View" label over project cards; disabled on touch and reduced-motion.
- **Nav:** transparent over hero → on scroll >80px becomes semi-transparent `--plaster`/`--ink` (adaptive to section) at 70% opacity with `backdrop-blur(12px)`, height shrinks 96px → 64px, logo scales ~0.85; a 2px gold scroll-progress bar runs along its bottom edge.
- **Page transitions:** ink-colored panel wipes up over the old page, gold accent line sweeps, new page content staggers in. 600–800ms total, skippable by reduced-motion.
- **Preloader (first visit only, sessionStorage-gated):** counting percentage + logo mask reveal, max 2.5s, never blocks longer than actual load.

---

## 4. Sitemap

### 4.1 Public

```
/                         Home
/portfolio                Portfolio — category landing (Government / Real Estate / Residential / …)
/portfolio/[category]     Category — filterable project grid
/portfolio/[category]/[project]   Project case study
/contact                  Get in Touch
/about                    About the Group (story, timeline, leadership, values)
/sectors/[sector]         Sector/service detail pages (admin-creatable)
/news                     Newsroom / Insights
/news/[slug]              Article
/careers                  Careers + open positions
/certifications           Certifications, Safety & Quality (tender trust page)
/partners                 Partners & Clients + partner inquiry
/legal/privacy, /legal/terms, /legal/cookies
```

Primary nav (max 6): Home · Portfolio · Sectors · About · News · Contact — with a full-screen overlay menu (staggered link reveal, office info, socials) for everything else. Nav items are **admin-managed** (§7).

### 4.2 Admin (all under /admin, auth-gated, `noindex`)

```
/admin/login              Supabase email+password (+ optional TOTP)
/admin                    Dashboard: inquiries count, recent edits, quick links, deploy status
/admin/pages              List/create/reorder pages → block-based page builder per page
/admin/projects           Project CRUD + gallery manager + category assignment + ordering
/admin/categories         Portfolio category CRUD (name, slug, theme color, cover, order)
/admin/news               Article CRUD (rich text, cover, tags, publish date)
/admin/media              Media library (upload, search, alt text, replace, usage refs)
/admin/navigation         Header nav, footer columns, social links (drag-reorder, nesting)
/admin/settings           Site settings: logo, contact info (phone/email/fax/addresses), SEO defaults, stat counters, palette accent overrides, scripts (analytics)
/admin/inquiries          Inbox for contact + partner form submissions (read/replied/archived, CSV export)
/admin/users              Admin user management (owner role only)
```

---

## 5. Page Specifications

Every section below is a **block instance** rendered from the CMS (§7), so order, copy, imagery, and buttons are all editable. The specs define the default composition and its animation choreography.

### 5.1 Home (`/`)

Section order (each alternates plaster/ink backgrounds for rhythm):

1. **Hero — 100vh, cinematic.**
   - Background: subtly moving media layer — either (a) a looping muted `<video>` (10–20s, ≤4MB, poster image, admin-uploadable) of a construction timelapse/drone shot, or (b) a canvas particle field (≤180 gold particles, connecting lines, drifting slowly). Admin toggles video vs particles. A left-to-right ink gradient scrim keeps the **left half as negative space for typography**.
   - Foreground, left-aligned: kicker ("CHARACOM GROUP — BUILDING CYPRUS SINCE 19XX"), display-1 headline with SplitTextReveal (e.g., "We build what outlasts us."), one-line subhead, two MorphButtons ("Explore Portfolio" gold-filled, "Get in Touch" ghost).
   - Scroll cue: thin vertical line + "SCROLL" that pulses; hero content parallaxes up at 0.85x and fades as user scrolls (ScrollTrigger scrub).
2. **Experience / Stats band (dark ink).** 4–6 Counters from site settings — e.g., Years of Experience, Projects Delivered, Employees & Engineers, Sq.m Developed, Government Contracts, Offices. Gold numbers, stone labels, thin gold divider lines that draw themselves in. This is the "number animation thing" — counters fire once at 60% viewport.
3. **About the Group paragraph (plaster).** Kicker + a 2–3 sentence editorial paragraph about Characom (admin-editable rich text) revealed line-by-line with a scrub-linked opacity ramp (each line brightens from 15% → 100% as it crosses the viewport center — the "reading light" effect). Right side: a portrait-ratio image with parallax (background moves slower than frame) + "More about us →" text link with animated underline.
4. **What we do — three sector cards.** Government & Infrastructure / Real Estate Development / Residential. TiltCards, each themed (cypress/aegean/gold glow), image top, title, one line, arrow. Staggered rise-in. Click → its portfolio category.
5. **Featured projects — pinned horizontal showcase (dark).** Section pins; 3–5 flagship projects slide horizontally as the user scrolls (GSAP scrub). Each slide: full-height image, oversized index number (01/02/03) parallaxing at a different rate, project name + location + "View case study". Mobile fallback: vertical stacked cards with standard reveals (no pinning under 1024px).
6. **Experience timeline teaser.** Horizontal strip of 4 milestone years with a gold line that draws across on scroll; links to /about timeline.
7. **News teaser.** Latest 3 articles, minimal list rows that slide a thumbnail preview on hover; "All news →".
8. **CTA band.** Ink background, gradient gold mesh, display-2 "Have a project in mind?", MorphButton → /contact. Section scales from 0.96 → 1 and fades in.
9. **Footer.** 4 columns (Sectors, Company, Offices, Newsletter/socials), all admin-managed; large watermark "CHARACOM" outline text at 4% opacity that parallaxes slightly; back-to-top magnetic button.

### 5.2 Portfolio landing (`/portfolio`)

- Short hero (40vh): kicker + display-2 "Our Work", counter of total projects.
- **Category panels:** one full-width panel per category (Government Projects, Real Estate Development, Residential, + any admin-added). Each: full-bleed background image (slow Ken Burns), theme-color scrim on hover, category name in display-1, project count Counter, "Explore →". Panels reveal with staggered clip-path wipes. Hovering a panel dims siblings.
- Categories come from the `project_categories` table — adding one in admin adds a panel and a route automatically.

### 5.3 Portfolio category (`/portfolio/[category]`)

- Hero themed to the category color; headline SplitTextReveal; breadcrumb.
- **Filter bar (sticky under nav):** status (Completed / In Progress), year, location — animated pill filters; active pill fills with theme color via layout animation (shared layout indicator).
- **Project grid:** 2–3 col responsive masonry-ish grid of TiltCards (image, name, location, year chip). Filtering animates with FLIP (Framer Motion layout) — cards glide to new positions, exits fade+shrink.
- Card click → project detail (page transition wipe uses the category theme color).

### 5.4 Project case study (`/portfolio/[category]/[project]`)

- **Hero:** full-bleed cover image, parallax zoom-out from 1.15 → 1 on load; title reveal; meta row (Location · Year · Status · Client · Value optional).
- **Spec sheet:** two-column — narrative rich text left, sticky fact table right (scope, sq.m, duration, services). Table rows stagger in.
- **Gallery:** editorial mixed layout (full-bleed, two-up, offset) from admin-ordered images; each image reveals via clip-path; optional embedded video block; lightbox with keyboard nav.
- **Next project footer:** full-width teaser of the next project in the category — image scales up as it enters; whole block is a link. Keeps users flowing through the portfolio (Cyfield has nothing like this).

### 5.5 Get in Touch (`/contact`)

- Split layout. Left (ink): **contact method cards** — Phone, Email, Fax, Address(es) — each an icon that draws itself (SVG stroke animation), value in display type, copy-to-clipboard micro-interaction (icon morphs to checkmark). All values from site settings. Office list with hours.
- Right (plaster): **form** — name, email, phone, subject select (General / Project Inquiry / Partnership / Careers), message. Floating labels; inputs underline in gold on focus; submit MorphButton shows spinner → success state (button morphs to a wide gold check panel, confetti-free, elegant). Zod validation, honeypot + time-trap anti-spam, GDPR consent checkbox.
- Submission → `inquiries` table + email notification to admin address (Resend). Errors surface inline, never alerts.
- Below: full-width dark-styled map embed (custom ink/gold map style), lazy-loaded.

### 5.6 Recommended additional pages (the "make it richer" answer)

Priority-ordered; each is a real differentiator against Cyfield:

1. **About / Our Story (`/about`)** — scroll-driven timeline (19XX → today) where a gold line draws down the page and milestone cards alternate sides; leadership grid (hover reveals bio); values; awards row. *Cyfield's about page is static text.*
2. **Certifications, Safety & Quality (`/certifications`)** — ISO badges, safety record counters, tender credentials, downloadable company profile PDF (admin-uploadable file). *Decisive for government clients — Cyfield buries this.*
3. **Newsroom (`/news`)** — articles with rich text editor; drives SEO and proves the company is alive. Match Cyfield's news cadence.
4. **Sector detail pages (`/sectors/[sector]`)** — one editorial page per service line (capabilities, equipment, method, featured projects). Created freely in admin via the page builder.
5. **Careers (`/careers`)** — culture section + open positions list (admin CRUD) + application form into inquiries. *Talent is a competitive front; Cyfield has this, so parity is required.*
6. **Partners & Clients (`/partners`)** — logo wall (grayscale → color on hover), testimonials slider, partner inquiry form. Counters of repeat clients.
7. **Legal set** — privacy/terms/cookies via page builder + cookie consent banner (required for GDPR/Cyprus).
8. **Later (phase 2+):** multilingual EL/GR + RU (Cyfield serves RU investors), property-style search if Characom sells units, 3D/360 project viewers, investor relations page.

---

## 6. Animation Architecture

### 6.1 Global providers (app-level, in order)

1. **ReducedMotionProvider** — reads `prefers-reduced-motion` + an optional user toggle in the footer; exposes a context every animation primitive must consult.
2. **SmoothScrollProvider** — instantiates Lenis, drives it from GSAP's ticker (single RAF loop), registers ScrollTrigger's scrollerProxy. Disabled entirely under reduced motion and on touch devices (native scroll there).
3. **PageTransitionProvider** — Framer Motion AnimatePresence around route content; ink wipe out/in; ScrollTrigger instances are killed and refreshed on every route change (critical — stale triggers are the #1 source of bugs).
4. **CursorProvider** — custom cursor layer; desktop + fine-pointer only.

### 6.2 Reusable animation primitives (build once, use everywhere)

`<Reveal>` (fade/rise/clip variants, viewport-triggered, once), `<SplitTextReveal>` (lines/words), `<Counter>`, `<Parallax speed={}>`, `<TiltCard>`, `<MagneticButton>`, `<MorphButton>`, `<DrawLine>` (SVG stroke), `<KenBurns>`, `<PinnedScene>` (horizontal showcase wrapper). No page may hand-roll a one-off animation that one of these can express — consistency is the aesthetic.

### 6.3 Performance rules (60fps contract)

- Animate **only** `transform` and `opacity`. Never top/left/width/height/margin. Clip-path reveals allowed (GPU-composited) but sparingly.
- `will-change` applied just-in-time by GSAP/Framer, never left permanently on elements.
- All scroll effects gated by IntersectionObserver / ScrollTrigger — nothing animates off-screen.
- Below-the-fold heavy scenes (pinned showcase, particle canvas, map) are `next/dynamic` imports with SSR off where appropriate; hero media preloaded, everything else lazy.
- Particle canvas: cap devicePixelRatio at 2, ≤180 particles, pause when tab hidden or hero off-screen.
- Images: `next/image` with correct `sizes`, AVIF/WebP, blur placeholders; hero poster ≤120KB.
- Test procedure: Chrome DevTools performance trace on 4x CPU throttle — no frame >16.7ms during scroll on Home; Lighthouse Performance ≥ 90 mobile / ≥ 95 desktop.

### 6.4 Reduced motion behavior

Under `prefers-reduced-motion`: Lenis off (native scroll), all reveals become simple 200ms fades or instant, counters render final values immediately, pinned horizontal section becomes a vertical list, video background replaced by its poster, particles/custom cursor/magnetic effects disabled, page transitions become crossfades. This must be a single global switch, not per-component patches.

---

## 7. Admin & Content Architecture (edit **everything** without a developer)

### 7.1 Principles

- **Block-based page builder.** Every public page is a `pages` row owning an ordered list of `sections` (block instances). A block = `type` + JSONB `props` (copy, images, buttons, settings). The public site renders pages by mapping section types to React components via a **block registry**.
- Because buttons/links/images are just props inside blocks, the admin can add a new button, swap an image, change a link, or reorder sections on ANY page — satisfying "modify and edit anything and everything."
- New pages: admin creates a page (title, slug, SEO fields), composes blocks, publishes → route exists immediately via the catch-all `[...slug]` renderer. Structured routes (portfolio, news) come from their own tables but their hero/intro copy is still block-driven.

### 7.2 Block registry (initial set)

Hero (video/particles toggle), StatsCounters, RichText, ImageWithText (parallax side image), SectorCards, FeaturedProjectsShowcase, ProjectGrid (auto from category), CategoryPanels, Timeline, TeamGrid, LogoWall, Testimonials, NewsList, FAQ (accordion), CTA Band, ContactMethods, ContactForm, MapEmbed, FileDownload, Spacer/Divider, RawEmbed (owner-role only). Each block declares a Zod schema for its props → the admin **auto-generates its edit form** from the schema (fields, image pickers, button editors, color-theme selects). Adding a future block = component + schema, nothing else.

### 7.3 Editing experience

- `/admin/pages/[id]`: left = draggable section list (add/duplicate/delete/reorder), right = form for the selected block + a live **preview iframe** rendering the draft via Next draft mode.
- Draft/publish workflow: every page/project/article has `draft_content` and `published_content`. Publish copies draft → published and calls the on-demand revalidation endpoint. "Preview" opens the site in draft mode (cookie-gated).
- Media library: Supabase Storage bucket `media`; grid with search, folders/tags, drag-drop upload (client-side resize >2560px), required alt text, "where is this used" reference list, safe replace. Separate `files` bucket for PDFs (company profile, tender docs).
- Navigation editor: tree UI for header nav (2 levels max) and footer columns; items are {label, type: page|category|external|file, target, newTab}. Social links list.
- Settings: contact info (phone, email, **fax**, addresses, hours), logo upload, default SEO/OG, home stat counters, analytics ID, accent-color overrides (writes CSS custom properties), maintenance-mode toggle.
- Inquiries inbox: table with status (new/read/replied/archived), detail drawer, CSV export, per-subject email routing.

### 7.4 Auth & security

- Supabase Auth, email+password, invite-only (no public signup). Roles: `owner` (users, settings, raw embeds) and `editor` (content). Enforced via a `profiles.role` column checked in RLS **and** in middleware protecting `/admin`.
- RLS: anonymous role can SELECT only `published` content and public media; INSERT allowed only on `inquiries` (rate-limited via edge middleware + honeypot); all writes require authenticated admin JWT. Storage buckets: public-read, admin-write.
- `/admin` served with `noindex,nofollow`, excluded from sitemap; audit log table records who changed what.

---

## 8. Data Model (Supabase Postgres)

| Table | Key columns (beyond id/timestamps) |
|---|---|
| `pages` | title, slug (unique), status (draft/published), seo (jsonb: title, description, og_image), sort_order, show_in_nav |
| `sections` | page_id FK, block_type, props (jsonb), sort_order, is_visible; plus published_props (jsonb) for the live copy |
| `project_categories` | name, slug, theme_color, cover_image, intro (jsonb), sort_order |
| `projects` | category_id FK, name, slug, location, year, status (completed/in_progress), client, value_label, summary, body (jsonb rich text), cover_image, specs (jsonb key/value list), is_featured, sort_order, page_status (draft/published), seo (jsonb) |
| `project_images` | project_id FK, media_id FK, layout_hint (full/half/offset), caption, sort_order |
| `news_posts` | title, slug, excerpt, body (jsonb), cover_image, tags text[], published_at, status |
| `navigation_items` | menu (header/footer_col_1..n/social), label, link_type, target, parent_id, sort_order, new_tab |
| `site_settings` | singleton row: contact (jsonb: phones, emails, fax, offices[]), branding (jsonb), seo_defaults (jsonb), stats (jsonb array {label, value, suffix}), integrations (jsonb) |
| `media` | storage_path, alt, width, height, mime, tags text[], uploaded_by |
| `files` | storage_path, label, mime, size |
| `inquiries` | subject_type, name, email, phone, message, source_page, status, consent_at, replied_at |
| `careers_positions` | title, department, location, type, description (jsonb), is_open, sort_order |
| `profiles` | user_id (auth FK), display_name, role (owner/editor) |
| `audit_log` | actor_id, entity, entity_id, action, diff (jsonb) |

Rich text stored as structured JSON (Tiptap document), rendered by a shared renderer on the public site — never raw HTML from editors.

---

## 9. Repository Structure

```
characom/
├── app/
│   ├── (site)/                    # public route group — shared layout (nav, footer, providers)
│   │   ├── page.tsx               # Home (block-rendered)
│   │   ├── portfolio/ …           # landing, [category], [category]/[project]
│   │   ├── news/ …                # index, [slug]
│   │   ├── contact/, about/, careers/, certifications/, partners/, sectors/[sector]/
│   │   └── [...slug]/             # catch-all renderer for admin-created pages
│   ├── admin/                     # admin route group — own layout, auth middleware
│   ├── api/                       # revalidate, inquiries, draft-mode endpoints
│   ├── sitemap.ts, robots.ts, opengraph-image.tsx
├── components/
│   ├── blocks/                    # one component per block type + registry
│   ├── motion/                    # Reveal, SplitTextReveal, Counter, TiltCard, MorphButton, Parallax, PinnedScene, DrawLine…
│   ├── layout/                    # Nav, FullscreenMenu, Footer, PageTransition, Preloader, Cursor
│   ├── ui/                        # buttons, inputs, chips, lightbox (shared site+admin where sensible)
│   └── admin/                     # page builder, block forms, media library, nav editor, inquiry inbox
├── lib/                           # supabase clients (server/browser), queries, zod schemas, block registry types, seo helpers, motion constants (durations/eases)
├── styles/                        # globals, design tokens
├── supabase/                      # migrations, seed script (demo content: 3 categories, 9 projects, pages, settings)
└── docs/ARCHITECTURE.md           # this file
```

Motion constants live in ONE file (durations, eases like `power4.out`, stagger values) so the whole site's timing feels authored, not accidental.

---

## 10. Performance, SEO & Accessibility Budgets

- **Perf:** LCP < 2.0s (mobile 4G), CLS < 0.05, INP < 200ms, JS on Home < 250KB gz (GSAP+Lenis+FM budgeted; admin code never ships to public bundle).
- **SEO:** per-page metadata from CMS; canonical URLs; XML sitemap (auto from published content); JSON-LD — `Organization` sitewide, `Project`→`CreativeWork` on case studies, `NewsArticle` on news; OG image template with project imagery. Human-readable slugs everywhere. i18n-ready URL structure (default EN, `/el`, `/ru` reserved for phase 2).
- **Accessibility (WCAG 2.1 AA):** zoom never blocked (beat Cyfield here); full keyboard nav incl. fullscreen menu, filters, lightbox (focus trap + Esc); visible focus rings (gold, 2px offset); contrast-checked tokens (`--gold-deep` on light); all motion decorative — content readable with JS/animation off; form labels + error announcements via aria-live; alt text enforced by admin.

---

## 11. Deployment & Environments (GitHub + Vercel)

- GitHub repo `characom-site`; `main` → production; every PR → Vercel preview deployment. Conventional commits.
- Vercel project envs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `REVALIDATE_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Two Supabase projects: `characom-staging` (linked to previews) and `characom-prod`. Migrations via Supabase CLI, committed to repo, applied in CI.
- Content publishes NEVER require a deploy (on-demand ISR). Deploys only for code changes.
- Custom domain + `www` redirect on Vercel; security headers (CSP, HSTS, frame-deny for public, same-origin for admin preview iframe).

---

## 12. Build Plan for Claude Code — Phases & Acceptance Criteria

Execute in order; each phase must meet its criteria before the next.

**Phase 0 — Foundation.** Scaffold Next.js+TS+Tailwind; design tokens; fonts; Supabase projects + all migrations + seed data (3 categories, 9 placeholder projects with Unsplash imagery, settings, nav). ✅ Site boots, tokens render, seed queries work.

**Phase 1 — Motion core.** Providers (reduced-motion, Lenis+GSAP sync, page transitions, cursor); all primitives in `components/motion` with a hidden `/dev/motion` playground page demonstrating each. ✅ 60fps on playground, reduced-motion verified for every primitive.

**Phase 2 — Layout shell.** Nav (shrink/blur/progress), fullscreen menu, footer, preloader — wired to CMS nav + settings. ✅ Nav adapts over light/dark sections; keyboard accessible.

**Phase 3 — Home.** All 9 sections as blocks rendered from CMS, full choreography incl. pinned showcase + counters + particle/video hero. ✅ Matches §5.1; Lighthouse ≥90 mobile; mobile fallbacks working.

**Phase 4 — Portfolio.** Landing panels, category pages with FLIP filtering, project case studies with gallery/lightbox/next-project; category theming. ✅ Matches §5.2–5.4; adding a category row in DB creates a working themed route.

**Phase 5 — Contact + secondary pages.** Contact (form → inquiries + email), About timeline, Certifications, News, Careers, Partners, legal + cookie banner. ✅ Form submissions stored, emailed, spam-protected.

**Phase 6 — Admin.** Auth+roles+RLS, dashboard, page builder with preview + draft/publish + revalidation, projects/categories/news/careers CRUD, media library, nav editor, settings, inquiries inbox, audit log. ✅ A non-technical user can: edit any home text/image, add a project with gallery, create a brand-new page with buttons/links, reorder the nav, change the fax number — all live within seconds, no deploy.

**Phase 7 — Hardening.** SEO (metadata/sitemap/JSON-LD/OG), accessibility audit, performance pass to budgets, security headers, error/404 pages (branded, animated), analytics hook. ✅ Budgets in §10 met; axe clean.

**Phase 8 — Launch.** Real content load via admin, domain, prod envs, README + admin user guide (`docs/ADMIN-GUIDE.md`). ✅ Production live.

### Kickoff prompt for Claude Code

> "Read `docs/ARCHITECTURE.md` in full. Build Phase 0 exactly as specified — do not deviate from the stack, tokens, or data model. Ask before substituting any library. After each phase, run the acceptance criteria and report pass/fail before continuing."

Then per phase: "Proceed to Phase N per ARCHITECTURE.md §…", pasting the relevant section numbers. Keep this file as the single source of truth; update it when decisions change.

---

## 13. Content the Owner Must Supply (placeholders until then)

Logo (SVG), real founding year + true stat numbers (never fabricate figures on the live site), project photos ≥1920px, project facts (client, year, scope, sq.m), leadership photos/bios, certifications list, office addresses/phone/fax, company profile PDF, hero video (optional, ≤4MB loop). Seed data ships with clearly-marked placeholders so the site is fully demo-able on day one.


---

## 14. Amendment — "Vercel and GitHub only" (2026-07-07, owner directive)

The owner directed that the stack use **Vercel and GitHub only** — no
Supabase or any third-party backend. The implementation therefore replaces
§2's Supabase layer as follows; everything else in this document stands.

| Concern | Original (Supabase) | Implemented (GitHub-backed) |
|---|---|---|
| Database | Postgres tables (§8) | JSON documents in `/content` (same shapes, see `lib/content/types.ts`) |
| Content reads | supabase-js queries | `lib/content` — local fs in dev/build, GitHub Contents API on Vercel, cached with tag `content` |
| Publish flow | webhook → revalidate | admin API commits to GitHub → `revalidateTag("content")` → live in seconds, no redeploy |
| Auth | Supabase Auth + RLS | env-var credentials (`ADMIN_EMAIL` + scrypt `ADMIN_PASSWORD_HASH`, optional `ADMIN_EDITORS`) + signed JWT cookie (`jose`), enforced in middleware + every admin API route |
| Storage / media | Supabase Storage buckets | binaries committed to `/media` via GitHub API, served through `/api/media/*` (next/image-compatible) |
| Inquiries | `inquiries` table + email | JSON files in `/content/inquiries` (committed via GitHub API) + optional Resend email notification |
| Roles | `profiles.role` + RLS | `owner` / `editor` from env config, checked server-side |
| Audit log | `audit_log` table | `/content/audit-log.json` (rolling 300 entries) |

Operational notes:

- Required Vercel env vars: `AUTH_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD_HASH`, `GITHUB_TOKEN` (fine-grained PAT, Contents R/W),
  `GITHUB_REPO`, `GITHUB_BRANCH`, `NEXT_PUBLIC_SITE_URL`,
  `REVALIDATE_SECRET`; optional `RESEND_API_KEY`, `INQUIRY_NOTIFY_EMAIL`.
- Content commits made by the CMS are plain git commits — full version
  history, rollback via git revert.
- If the repository is public, keep in mind inquiries contain personal data:
  either keep the repo private (recommended) or disable inquiry storage and
  use email-only notifications.

## 15. Amendment — Luxury motion redesign (2026-07-12, owner directive)

Owner directed a fluency/luxury pass on the same structure:

- **Animation library:** `framer-motion` imports migrated to **Motion**
  (motion.dev) via `motion/react` — same API family, canonical package.
- **Typography:** Space Grotesk/Inter replaced with **Cormorant Garamond**
  (display serif) + **Jost** (UI/body) — the DAMAC/Emaar-tier
  luxury-property register (Emaar's identity is Optima-led; Cormorant is the
  closest premium open-font equivalent). Display tracking relaxed for serif
  set; kickers widened to 0.24em.
- **Load counter:** the first thing a visitor sees on EVERY full page load is
  a giant counting percentage (Preloader — sessionStorage gate removed), and
  client-side route changes run the same counter on the transition panel
  (PageTransitionProvider). Both are rAF-driven, hard-capped, and skipped
  under reduced motion.
- **Scroll feel:** Lenis tuned to a 1.35s expo-eased glide.
- Palette, structure, routes, content model: unchanged.

## 16. Amendment — "Noir Luxe" palette + deterministic transitions (2026-07-12)

- **Palette** (owner directive): black `#0A0A0D` · gold `#C4A052` (bright
  `#E3C57C`, deep `#7E6426`) · royal purple `#46265C` (token key `--aegean`,
  display name updated) · deep green `#17352A` (`--cypress`) · tan-white
  `#EDE6D9` (`--plaster`). Token KEYS unchanged for content compatibility.
- **Page transitions rewritten**: the dual-panel AnimatePresence choreography
  raced and could leave a covering panel stuck (reported on sector pages).
  Now a single persistent overlay + explicit state machine: intercepted
  internal link clicks → cover (photo + %) → router.push behind cover →
  reveal, with a 3s watchdog that guarantees the overlay always clears. The
  site shell no longer remounts per navigation; ScrollTrigger cleanup now
  kills only triggers whose DOM was actually unmounted.
- **New block `constructionScene`**: scroll-scrubbed isometric CSS-3D tower
  (floors assemble bottom-up, slewing crane, topping-out glow) — placed on
  the home page; floors/copy admin-editable. Pure CSS 3D + GSAP, no deps.
