# CHARACOM GROUP — Website

Ultra-premium, cinematic marketing site + self-serve admin CMS for Characom
Group. Built to `docs/ARCHITECTURE.md` with one amendment: the stack is
**Vercel + GitHub only** — the GitHub repository is the database.

- **Framework:** Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4
- **Motion:** GSAP 3 + ScrollTrigger · Framer Motion · Lenis · SplitType
- **Content:** JSON in [`/content`](content) — read via local fs in dev, via
  the GitHub Contents API in production; publishes revalidate instantly, no
  redeploy
- **Admin:** `/admin` — block-based page builder, projects/news/careers CRUD,
  media library, navigation editor, settings, inquiries inbox, audit log

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the site runs entirely from the committed demo
content. Admin: http://localhost:3000/admin (dev login:
`admin@characom.dev` / `characom`; local edits write straight to `/content`).

## Deploy (Vercel + GitHub)

1. Import this repo in Vercel (framework auto-detected).
2. Set environment variables (see [`.env.example`](.env.example)):
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` — `node scripts/hash-password.mjs "your-password"`
   - `GITHUB_TOKEN` — fine-grained PAT with **Contents: Read & write** on this repo
   - `GITHUB_REPO` (e.g. `AmjadRx/Characom-Site`), `GITHUB_BRANCH` (`main`)
   - `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`
   - optional: `RESEND_API_KEY`, `INQUIRY_NOTIFY_EMAIL`
3. Deploy. Admin publishes commit to GitHub and revalidate the live site in
   seconds — code deploys only happen when code changes.

> **Privacy note:** contact-form inquiries are stored as JSON in
> `content/inquiries/`. Keep the repository **private**, or configure
> email-only notifications.

## Project structure

```
app/(site)/        public routes (block-rendered from /content)
app/admin/         CMS (auth-gated, noindex)
app/api/           auth, admin CRUD, inquiries, media, preview, revalidate
components/blocks/ one component per block type + registry
components/motion/ Reveal, SplitTextReveal, Counter, TiltCard, MorphButton…
components/layout/ nav, fullscreen menu, footer, preloader, cursor
components/admin/  page builder, media library, nav editor, inbox
content/           ← the database (JSON, committed)
lib/               content store, block schemas, auth, motion constants
docs/              ARCHITECTURE.md (spec) · CONTRACTS.md · ADMIN-GUIDE.md
```

## Content & placeholders

All demo content (3 categories, 9 projects, news, team, stats) is clearly
placeholder — replace via `/admin` per `docs/ADMIN-GUIDE.md`. Never publish
fabricated figures: update stats, founding year, and contact details in
Admin → Settings before launch.
