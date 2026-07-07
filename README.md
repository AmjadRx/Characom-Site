# Cyfield Group — Motion-rich concept redesign

A premium, highly graphic, fully responsive redesign of [cyfieldgroup.com](https://www.cyfieldgroup.com/) — rebuilt as a fast, static, multi-page site with GSAP-driven motion. No build step, no framework, deploys anywhere (GitHub Pages included).

**Palette:** deep terracotta + warm ink/black + bone. **Type:** Space Grotesk (display) + Inter (body). **Motion:** GSAP + ScrollTrigger + Lenis smooth scroll.

---

## Pages

| File | Page | Highlights |
|------|------|-----------|
| `index.html` | **Home** | 100vh hero with cross-fading slideshow + animated particle canvas, split-line title reveal, animated **stat counters** (5k+ customers, 400+ developments, 700+ employees…), sectors, company paragraph, landmark feature, project preview, news, regions, CTA |
| `portfolio.html` | **Portfolio** | Pick a **category** (Government & Infrastructure · Real Estate · Residential · Energy) → it filters/reveals the project grid. Tilt + glow cards, slide-in **detail lightbox** with project metadata |
| `contact.html` | **Get in touch** | Phone, toll-free, **email**, **fax**, address cards, animated floating-label form with success state, dark map embed, office list |
| `about.html` | **About** (bonus) | Story timeline (1990 → today), values, leadership, compact stats |

## Structure

```
Characom Site/
├── index.html
├── portfolio.html
├── contact.html
├── about.html
├── css/
│   └── style.css        # full design system + all components
├── js/
│   └── main.js          # GSAP, counters, nav, hero, portfolio filter, lightbox, cursor…
├── README.md
└── .gitignore
```

## Run locally

Just open `index.html` in a browser. For best results (so smooth-scroll and relative paths behave exactly like production) serve it:

```bash
# from inside the project folder
python -m http.server 8000
# then open http://localhost:8000
```

## Motion & interaction

- Preloader with counting number, sticky **nav that shrinks** on scroll, scroll-progress bar
- Scroll-triggered reveals (fade / rise / clip / scale), staggered groups, parallax
- Animated **number counters** that fire when scrolled into view
- Hero: crossfading Ken-Burns slideshow + connected-particle canvas
- Buttons **morph** (square → rounded) with a terracotta wipe + magnetic pull
- Project cards **tilt in 3D** and glow toward the cursor
- Custom cursor (desktop), running marquee, mobile full-screen menu
- Fully keyboard/`Esc`-closable lightbox
- Respects `prefers-reduced-motion` and degrades gracefully if a CDN fails

## Tech / dependencies (all via CDN — nothing to install)

- [GSAP 3.12](https://gsap.com/) + ScrollTrigger — `cdnjs.cloudflare.com`
- [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll — `cdn.jsdelivr.net` (optional; native scroll used if it fails)
- Google Fonts: Space Grotesk + Inter

## Images

All imagery uses free Unsplash photos with an automatic fallback (`onerror` → Lorem Picsum) so **nothing ever renders as a broken box**. To use your own photos, drop them in an `images/` folder and swap the `src` on each `<img>`. Search `unsplash.com` in the HTML to find every image reference.

## Customize

- **Colors / fonts / spacing:** edit the `:root` tokens at the top of `css/style.css` (`--terra`, `--ink`, `--bone`, `--font-display`, …). Change `--terra` once to re-skin the whole site.
- **Content:** copy is plain text in the HTML files.
- **Stats:** edit the `data-count="…"` attribute on each `.stat` in `index.html`.
- **Projects:** each card in `portfolio.html` carries `data-cat`, `data-title`, `data-location`, `data-year`, `data-type`, `data-status`, `data-desc`, `data-img` — edit those and the filter/lightbox update automatically. Update the counts in the `.filter` buttons and `.cat` blocks if you add/remove projects.
- **Contact form:** currently front-end only (shows a success state). To actually receive messages, point the `<form>` at [Formspree](https://formspree.io/) / [Getform](https://getform.io/) or your backend.

---

## Push to your GitHub repo

This folder is already a git repository with an initial commit. Connect it to your existing repo and push:

```bash
cd "Characom Site"

# point at YOUR repo (replace the URL)
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

If your repo **already has commits** (e.g. a README created on GitHub) and the push is rejected, either:

```bash
git pull origin main --allow-unrelated-histories   # merge, resolve, then push
# — or, to overwrite the remote with this site (only if the repo is empty/disposable):
git push -u origin main --force
```

## Deploy free on GitHub Pages

1. Push to GitHub (above).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. Your site goes live at `https://<your-username>.github.io/<your-repo>/` in ~1 minute.

---

## Ideas to make it richer (suggested extra pages)

The current build covers Home, Portfolio, Get-in-touch and About. Natural next pages, in priority order:

1. **Project detail pages** — turn the lightbox into full pages (gallery, spec sheet, map, related projects). Strongest SEO + shareability win.
2. **Services / Sectors** — one page each for Real Estate, Contracting, Energy explaining the offer and process.
3. **Newsroom / Blog** — an index + article template (the home page already teases news).
4. **Careers / Join our team** — culture, open roles, application form.
5. **Search Properties** — a filterable listings page (type, location, budget, status) like the original.
6. **Investment / Residency programmes** — Cyprus Permanent Residence, Greece Golden Visa explainers.
7. **Sustainability / ESG** — ties into the Energy story.
8. **FAQ**, **Privacy Policy**, **Cookie Policy** — trust + compliance.

Every one of these can reuse the existing components (page hero, cards, split, stats, timeline, CTA, footer), so they're fast to add.
