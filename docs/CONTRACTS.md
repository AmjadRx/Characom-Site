# Build Contracts — module boundaries & shared APIs

This document is the coordination contract for the Characom build. Every
module must export exactly what is specified here; consumers code against
these signatures. Read `lib/blocks/defs.ts`, `lib/content/types.ts`,
`lib/content/store.ts`, and `lib/motion/constants.ts` before writing code —
they are the source of truth for types.

## Global conventions

- **Stack:** Next.js 15 App Router, TypeScript strict, Tailwind v4 (tokens in
  `styles/globals.css`), GSAP + ScrollTrigger, Framer Motion, Lenis,
  SplitType. **No new npm dependencies** — package.json is locked.
- **Vercel + GitHub only.** No Supabase, no external DB. All content flows
  through `lib/content` (fs in dev, GitHub API in prod).
- **Framer vs GSAP ownership rule:** one owner per element. Framer =
  lifecycle/hover/layout/page transitions. GSAP = scroll-linked (ScrollTrigger,
  pins, scrubs, counters, split-text). Never both on one node.
- Animate only `transform`/`opacity` (clip-path allowed sparingly).
- All motion values come from `lib/motion/constants.ts` (`DUR`, `EASE`,
  `EASE_FM`, `STAGGER`, `TRIGGER`, `SPRING`).
- Every animated component must consult `useReducedMotionPref()` and degrade
  per ARCHITECTURE.md §6.4.
- Import GSAP ONLY via `lib/motion/gsap.ts` (registers ScrollTrigger once).
- Class merging via `cn` from `lib/utils.ts`. Icons: inline SVG (stroke 1.5,
  `currentColor`) — no icon library.
- Server components by default; `"use client"` only where interaction/motion
  requires it.
- Public data reads ONLY via `lib/content` (`getSettings`, `getNavigation`,
  `getCategories`, `getProjects`, `getProjectBySlug`, `getNews`,
  `getNewsBySlug`, `getOpenPositions`, `getPage`, …).

## Directory ownership (one owner per path — do not write outside your area)

| Area | Owner agent |
|---|---|
| `lib/*`, `styles/globals.css`, `components/blocks/registry.tsx` | foundation (done — read-only for everyone) |
| `components/motion/*`, `components/providers/*`, `lib/motion/gsap.ts`, `app/dev/motion/*` | motion |
| `components/layout/*` | layout |
| `components/blocks/{Hero,PageHero,StatsCounters,RichTextBlock,ImageWithText,SectorCards,Timeline,Faq,CtaBand,Spacer,RawEmbed}.tsx`, `components/ui/{RichText,SectionHeader}.tsx` | blocks-1 |
| `components/blocks/{FeaturedProjects,CategoryPanels,ProjectGrid,TeamGrid,LogoWall,Testimonials,NewsList,ContactMethods,ContactForm,MapEmbed,FileDownload,CareersList}.tsx`, `components/ui/{Lightbox,FloatingInput,FloatingTextarea,FloatingSelect,FilterPills}.tsx` | blocks-2 |
| `app/(site)/**`, `app/not-found.tsx`, `app/error.tsx` | pages |
| `app/api/**`, `middleware.ts`, `lib/seo.ts`, `lib/notify.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` | api-seo |
| `app/admin/{layout,page}.tsx`, `app/admin/login/*`, `app/admin/{settings,inquiries,users,audit}/*`, `components/admin/{api,AdminShell,QueryProvider,fields}*` | admin-core |
| `app/admin/{pages,projects,categories,news,careers,media,navigation}/*`, `components/admin/builder/*`, `components/admin/collections/*`, `components/admin/media/*` | admin-content |
| `content/**` | seed |

Blocks may freely IMPORT from `components/motion`, `components/ui`,
`lib/*`. Pages import blocks via `components/blocks/registry`.

## Providers (`components/providers`) — owner: motion

- `ReducedMotionProvider` + hook `useReducedMotionPref(): { reduced: boolean; toggle: () => void }`.
  Combines `prefers-reduced-motion` with a persisted user toggle
  (localStorage `characom-motion`), mirrors to `<html data-reduced-motion>`.
- `SmoothScrollProvider` — Lenis driven by GSAP ticker, ScrollTrigger synced
  (`lenis.on('scroll', ScrollTrigger.update)`); disabled for touch devices and
  reduced motion.
- `PageTransitionProvider` — Framer AnimatePresence ink-wipe between routes
  (700ms, gold sweep line); kills + refreshes all ScrollTriggers on route
  change; simple crossfade under reduced motion.
- `CursorProvider` — desktop fine-pointer only; dot + trailing ring; ring
  expands with label over elements marked `data-cursor="view"`
  (`data-cursor-label` optional); adds `has-custom-cursor` class to `<html>`.
- `SiteProviders` — composes all of the above in the order listed. Used once
  in `app/(site)/layout.tsx`.

All providers are client components exported from
`components/providers/index.ts` (named exports exactly as above).

## Motion primitives (`components/motion`) — owner: motion

All client components, named default exports, one file each, re-exported from
`components/motion/index.ts`:

- `Reveal` — `{ children, variant?: "fade"|"rise"|"clip"|"scale", delay?: number, duration?: number, y?: number, className?: string, as?: keyof JSX.IntrinsicElements }` viewport-triggered once at `TRIGGER.start`.
- `SplitTextReveal` — `{ text: string, as?: "h1"|"h2"|"h3"|"p"|"div", className?: string, delay?: number }` SplitType lines, mask + translateY(110%→0), stagger `STAGGER.lines`, `EASE.outHard`.
- `Counter` — `{ value: number, suffix?: string, className?: string, duration?: number }` counts 0→value once at `TRIGGER.counterStart`, suffix pops after, `tabular-nums`.
- `Parallax` — `{ children, speed?: number, className?: string }` scrubbed y-offset (speed 0.85 = moves slower; 1 = static-relative none).
- `TiltCard` — `{ children, theme?: "gold"|"cypress"|"aegean", className?: string, imageScaleOnHover?: boolean }` 3D tilt ≤6°, perspective 900, spring return, cursor-following radial glow in theme color.
- `MagneticButton` — `{ children, className?: string, range?: number }` ±8px spring pull, desktop only.
- `MorphButton` — `{ label: string, href?: string, onClick?: () => void, type?: "button"|"submit", variant?: "gold"|"ghost", loading?: boolean, success?: boolean, className?: string, dark?: boolean }` pill CTA: gold wipe from left, radius morph, magnetic, scale 0.97 click. `href` → renders Next `<Link>`. `loading` → spinner; `success` → morphs to check panel (contact form).
- `DrawLine` — `{ orientation?: "h"|"v", className?: string, delay?: number }` scaleX/Y 0→1 on scroll.
- `KenBurns` — `{ src: string, alt: string, className?: string, priority?: boolean, sizes?: string }` next/image wrapper w/ slow scale 1→1.06 loop (paused off-screen).
- `PinnedScene` — `{ children: React.ReactNode[], className?: string, heading?: React.ReactNode }` pins + horizontal scrub of slides on ≥1024px; vertical stack fallback below and under reduced motion.

`lib/motion/gsap.ts` (client-only): exports `{ gsap, ScrollTrigger }` with the
plugin registered exactly once.

## Layout (`components/layout`) — owner: layout

Named exports from `components/layout/index.ts`:

- `SiteHeader` — props `{ nav: NavigationItem[], settings: SiteSettings }`.
  Transparent over hero → after 80px scroll: 70% opacity plaster/ink +
  `backdrop-blur(12px)`, height 96→64px, logo scale .85; 2px gold scroll
  progress bar at bottom edge; hamburger opens `FullscreenMenu`; adapts
  light/dark via `data-nav-theme="dark"` attribute set on dark sections
  (blocks add it to their `<section>`), fully keyboard accessible.
- `FullscreenMenu` — internal (rendered by header): ink overlay, staggered
  link reveals, office info + socials from settings, focus trap + Esc.
- `SiteFooter` — props `{ nav: NavigationData, settings: SiteSettings }` —
  4 columns from nav data, newsletter/socials, giant CHARACOM watermark at 4%
  opacity w/ slight parallax, magnetic back-to-top button, reduced-motion
  toggle (uses `useReducedMotionPref`).
- `Preloader` — first visit per session only (sessionStorage
  `characom-preloaded`), counting % + logo mask reveal, hard cap `DUR.preloaderMax`.

## Shared UI (`components/ui`)

- `RichText` — `{ doc: RichDoc, className?: string, dark?: boolean }`
  server-safe renderer for Tiptap JSON (paragraph, heading 2–4, bold, italic,
  link, bulletList, orderedList, blockquote, image, horizontalRule). Never
  dangerouslySetInnerHTML. (owner: blocks-1)
- `SectionHeader` — `{ kicker?: string, heading?: string, text?: string, dark?: boolean, align?: "left"|"center", theme?: ThemeColor }` kicker + display-2 SplitTextReveal. (owner: blocks-1)
- `Lightbox` — `{ images: { src, alt, caption? }[], openIndex: number | null, onClose: () => void }` focus-trapped, keyboard nav (←/→/Esc). (owner: blocks-2)
- `FloatingInput` / `FloatingTextarea` / `FloatingSelect` — floating-label
  form fields, gold underline focus, error display + aria. Props: standard
  input props + `{ label: string, error?: string }`. (owner: blocks-2)
- `FilterPills` — `{ options: {label, value}[], value: string, onChange: (v: string) => void, theme?: ThemeColor }` animated shared-layout active pill (Framer `layoutId`). (owner: blocks-2)

## Blocks (`components/blocks/*`)

Every block: **async server component**, default export, signature
`({ props, ctx }: BlockComponentProps)`. Parse-safe props arrive already
validated/default-filled by `BlockRenderer` (registry.tsx — already written;
component file names are fixed by its imports). Blocks that need data call
`lib/content` directly (e.g. `SectorCards` with `useCategories`,
`StatsCounters` with `useSiteStats`, `FeaturedProjects`, `CategoryPanels`,
`ProjectGrid`, `NewsList`, `CareersList`, `ContactMethods`, `MapEmbed`).
Interactive inner parts live in `components/blocks/client/<Name>Client.tsx`
(client components) — owned by the same agent as the block.

Blocks render `<section>` with `className="section-dark"` +
`data-nav-theme="dark"` when their `dark` prop is set (or by design, e.g.
statsCounters/ctaBand/hero). Category theming: wrap content in a
`style={{ "--accent": … }}` override via helper `themeVars(theme)` — each
block implements locally using tokens `--gold/--cypress/--aegean`.

## Public routes (`app/(site)`) — owner: pages

- `layout.tsx` — fetches settings + navigation server-side; renders
  `SiteProviders` → `Preloader` → `SiteHeader` → `<main id="main">{children}</main>` → `SiteFooter`; skip-to-content link.
- `page.tsx` (home) → `getPage("home")` → BlockRenderer.
- `portfolio/page.tsx`, `portfolio/[category]/page.tsx`,
  `portfolio/[category]/[project]/page.tsx` (cinematic case study per §5.4 —
  hero zoom-out, spec sheet w/ sticky fact table, editorial gallery + Lightbox,
  next-project footer),
- `news/page.tsx`, `news/[slug]/page.tsx`, `contact`, `about`, `careers`,
  `certifications`, `partners` — each: `getPage(slug)` → BlockRenderer (their
  content pages exist in seed), plus structured data where relevant.
- `[...slug]/page.tsx` — catch-all for admin-created pages (incl.
  `legal/privacy` etc). 404 via `notFound()` when page missing/unpublished.
- Draft mode: when `(await draftMode()).isEnabled`, render
  `page.draftSections ?? page.sections`.
- `generateMetadata` from page SEO + settings.seoDefaults on every route.
- `generateStaticParams` for categories/projects/news; `export const revalidate = 300` on content routes.
- Cookie consent banner component `components/layout/CookieBanner` is owned
  by **pages** (client, localStorage, links to /legal/cookies).

## API routes (`app/api`) — owner: api-seo

Admin routes require session (verify via `requireSession()`; return 401 JSON
`{ error }`). All bodies JSON unless noted. GET returns the entity; PUT
replaces it (server validates with Zod where types exist).

- `POST /api/admin/auth/login` `{ email, password }` → sets `characom_admin`
  cookie (see `lib/auth/session.ts`), returns `{ ok: true, role }`; 401 on bad
  creds; rate-limited (5/min/IP, in-memory).
- `POST /api/admin/auth/logout` → clears cookie.
- `GET /api/admin/whoami` → `{ email, role }`.
- `GET|PUT /api/admin/settings` → `SiteSettings`.
- `GET|PUT /api/admin/navigation` → `NavigationData`.
- `GET|PUT /api/admin/categories` → `Category[]`.
- `GET|PUT /api/admin/projects` → `Project[]`.
- `GET|PUT /api/admin/news` → `NewsPost[]`.
- `GET|PUT /api/admin/careers` → `CareerPosition[]`.
- `GET /api/admin/pages` → page index. `POST` `{ page: Page }` creates.
- `GET|PUT|DELETE /api/admin/pages/detail?slug=<slug>` — GET → `Page`;
  PUT `{ page: Page, publish?: boolean }` (publish=true copies
  draftSections→sections, sets status published, clears draftSections);
  DELETE removes.
- `GET /api/admin/inquiries` → `Inquiry[]`; `PATCH /api/admin/inquiries` `{ id, status }`.
- `GET /api/admin/media` → `MediaIndex`; `POST` multipart form (`file`, `alt`)
  → stores binary at `media/<safe-name>`, updates index, returns `MediaItem`;
  `PATCH` `{ file, alt, tags }`; `DELETE` `{ file }`.
- `GET /api/admin/audit` → `AuditEntry[]`.
- `POST /api/inquiries` (public) `{ subjectType, name, email, phone?, message, consent: boolean, website?: string (honeypot), startedAt: number (time-trap) }`
  → validates (Zod), rejects honeypot/too-fast(<3s), rate-limits, saves via
  `saveInquiry`, fire-and-forget email via `lib/notify.ts` (Resend REST,
  skipped when no key). Returns `{ ok: true }`.
- `POST /api/revalidate` `{ secret }` or `x-revalidate-secret` header →
  `revalidateContent()`.
- `GET /api/preview?slug=<slug>` — requires session; enables Next draftMode,
  redirects to `/<slug>` (home → `/`). `GET /api/preview/exit` disables.
- `GET /api/media/[...path]` — serves media binary from content source
  (`getSource().readBinary("media/" + path)`), correct content-type,
  `Cache-Control: public, max-age=300, s-maxage=31536000, stale-while-revalidate`.
  Media URLs in content are `/api/media/<file>`.

`middleware.ts`: protects `/admin/**` (except `/admin/login`) and
`/api/admin/**` (except auth/login) by verifying the JWT cookie with `jose`
(edge-safe); redirects pages to `/admin/login?next=…`, returns 401 JSON for
APIs. Adds `X-Robots-Tag: noindex` on /admin.

`lib/seo.ts`: `absoluteUrl(path)`, `organizationJsonLd(settings)`,
`projectJsonLd(project, category)`, `newsArticleJsonLd(post)`, helpers return
plain objects; pages inject via `<script type="application/ld+json">`.

## Admin (`app/admin`, `components/admin`)

Client-heavy; TanStack Query for data, react-hook-form + zod on forms. Visual
language: ink sidebar, plaster canvas, gold accents — same tokens as site,
utilitarian layout. `components/admin/api.ts` (owner: admin-core) exports
typed fetch helpers used by all admin screens:
`adminGet<T>(path)`, `adminSend<T>(path, method, body)`,
`uploadMedia(file, alt)` — all throw `Error(message)` on non-2xx.

admin-core owns: login page (`/admin/login`), `AdminShell` (sidebar nav +
header + role badge + logout), dashboard `/admin` (inquiry count, recent
audit entries, quick links, content-source status incl. "GitHub token
missing" warning), `/admin/settings` (site settings form incl. stats editor,
contact/offices editor, hero media toggle, maintenance mode), `/admin/inquiries`
(status tabs, detail drawer, CSV export client-side), `/admin/users`
(env-configured user list, read-only + password hash generator UI calling
`POST /api/admin/users/hash` — that endpoint owned by api-seo), `/admin/audit`.

admin-content owns: `/admin/pages` (list + create), `/admin/pages/edit?slug=…`
— the block builder: left = draggable section list (dnd-kit) with
add/duplicate/delete/toggle-visibility, center/right = auto-generated form for
selected block from `BLOCK_DEFS[type].fields` (field kinds: text, textarea,
richtext → Tiptap editor, image → media picker modal, number, boolean,
select, link, list → repeatable rows), plus SEO panel; toolbar: Save draft /
Preview (opens `/api/preview?slug=` in new tab) / Publish. `/admin/projects`
(+gallery manager, ordering, featured flag), `/admin/categories`,
`/admin/news` (Tiptap editor), `/admin/careers`, `/admin/media` (grid,
search, upload w/ client resize >2560px via canvas, alt-text required,
delete), `/admin/navigation` (header tree 2 levels + footer columns + social,
dnd-kit reorder).

Shared field components in `components/admin/fields/*` (owner: admin-core):
`TextField`, `TextareaField`, `BooleanField`, `NumberField`, `SelectField`,
`ImageField` (opens MediaPicker via render-prop provided by admin-content —
keep loose: ImageField takes `{ value: {src,alt}, onChange }` and renders an
input pair + "Browse…" button that calls optional global picker registered by
admin-content), `LinkField`, `ListField`, `RichTextField` (Tiptap).

## Seed content (`content/`) — owner: seed

Files: `settings.json`, `navigation.json`, `categories.json` (3),
`projects.json` (9), `news.json` (4), `careers.json` (3),
`media.json` (`{"items":[]}`), `audit-log.json` (`[]`), `pages-index.json`,
`pages/{home,about,contact,portfolio,news,careers,certifications,partners}.json`,
`pages/legal/{privacy,terms,cookies}.json`. All block props MUST validate
against `lib/blocks/defs.ts` schemas. Imagery: Unsplash URLs
(`https://images.unsplash.com/photo-…?q=80&w=1920&auto=format&fit=crop`).
Placeholder facts clearly marked (§13): stats labeled honestly, founding year
1987 placeholder, phones like `+357 22 000 000`, `info@characom.example.com`.

## Build & error-handling conventions

- No `any` unless unavoidable; strict TS must pass (`npm run typecheck`).
- Never throw in render paths for missing content — fall back gracefully.
- All images: `next/image` with `sizes`, remote hosts limited to
  images.unsplash.com + `/api/media/*` (relative). `fill` + wrapper for
  unknown ratios.
- a11y: WCAG 2.1 AA — focus states, aria labels, keyboard everything,
  contrast tokens (`--gold-deep` for gold-on-light text).
