# Characom Admin — User Guide

The admin panel at **`/admin`** lets you edit everything on the site — text,
images, buttons, pages, projects, news, navigation, contact details — with no
developer. Changes go live within seconds of publishing.

## Signing in

Go to `https://your-domain/admin`. Sign in with the email and password your
administrator configured. There are two roles:

- **Owner** — everything, including raw-HTML blocks and user tooling.
- **Editor** — all content editing.

Local development uses `admin@characom.dev` / `characom` (development only —
production requires real credentials via environment variables; see README).

## How content works

The site's content is stored as files in the GitHub repository. Every save
you make in the admin becomes a git commit — you get full version history
for free, and nothing ever needs a redeploy:

1. **Save draft** — stores your working copy (visitors see nothing).
2. **Preview** — opens the real site rendering your draft.
3. **Publish** — makes it live. The site updates within seconds.

## Pages (the block builder)

**Admin → Pages** lists every page. Open one (or create a new page with any
URL you like) to enter the builder:

- **Left:** the page's sections (blocks). Drag to reorder, click the eye to
  hide, duplicate or delete. **Add block** offers every block type — heroes,
  stat counters, text + image, project grids, FAQs, CTA bands, forms, maps…
- **Right:** the selected block's settings — all copy, images, links and
  buttons are editable. Image fields open the media library.
- **SEO panel:** page title, description and social-share image.

Creating a page makes its URL exist immediately after publish (e.g. a page
with slug `sectors/roadworks` appears at `/sectors/roadworks`).

## Portfolio

- **Categories** — name, slug, theme color (gold / cypress green / aegean
  blue), cover image, intro. Adding a category automatically adds its panel
  on /portfolio and its own themed page.
- **Projects** — everything about a case study: summary, editorial body,
  cover, spec table (scope, area, duration…), the photo gallery (with
  full-width / half / offset layouts and captions), year, location, status,
  client, and the **Featured** star that puts it in the home showcase.

## News, Careers, Partners

- **News** — write articles in the rich-text editor, set cover, tags and
  date. Published articles appear on /news and in home-page teasers.
- **Careers** — maintain open positions; they appear on /careers.

## Media library

**Admin → Media** stores every uploaded image (uploads are committed to the
repository and served through the site). Alt text is required — it matters
for accessibility and SEO. Large images are automatically resized before
upload.

## Navigation

**Admin → Navigation** controls the header menu (up to 6 items, one dropdown
level) and the three footer columns plus social links. Drag to reorder.

## Site settings

**Admin → Settings** holds the global values: company name and tagline,
logo, phones, emails, **fax**, office addresses and hours, the home-page
stat counters, default SEO, the hero background (particles or video),
analytics ID, contact-page map, and maintenance mode.

> Before launch: replace all placeholder numbers (stats, founding year,
> phones, addresses) with real ones. Never publish fabricated figures.

## Inquiries

Contact-form submissions arrive in **Admin → Inquiries** — filter by status
(new / read / replied / archived), open the detail drawer to read and reply
by email, export CSV. If email notifications are configured, each inquiry is
also sent to your inbox.

> **Privacy:** if the repository is public, ask your developer to keep
> inquiry storage disabled (email-only) or make the repository private.

## Audit

**Admin → Audit** shows who changed what, and when.
