import type {
  Category,
  NewsPost,
  Project,
  SiteSettings,
} from "@/lib/content/types";

/**
 * SEO helpers (ARCHITECTURE.md §10): absolute URLs + JSON-LD builders.
 * All builders return plain objects — pages inject them via
 * `<script type="application/ld+json">{JSON.stringify(...)}</script>`.
 */

export type JsonLd = Record<string, unknown>;

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalized}`;
}

/** Media srcs are either absolute (Unsplash) or relative (/api/media/…). */
function absoluteImage(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return absoluteUrl(src);
}

/** Strip undefined values so the emitted JSON-LD stays clean. */
function compact(obj: JsonLd): JsonLd {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

export function organizationJsonLd(settings: SiteSettings): JsonLd {
  const offices = settings.contact.offices.map((office) =>
    compact({
      "@type": "PostalAddress",
      streetAddress: office.address,
      addressLocality: office.name,
      addressCountry: "CY",
    }),
  );
  const phone = settings.contact.phones[0];
  const email = settings.contact.emails[0];
  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: siteUrl(),
    logo: absoluteImage(settings.branding.logoImage),
    slogan: settings.tagline || undefined,
    foundingDate: settings.foundedYear ? String(settings.foundedYear) : undefined,
    email: email || undefined,
    telephone: phone || undefined,
    address: offices.length > 0 ? offices : undefined,
    contactPoint:
      phone || email
        ? [
            compact({
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: phone || undefined,
              email: email || undefined,
            }),
          ]
        : undefined,
  });
}

/** Case studies are modeled as CreativeWork (§10). */
export function projectJsonLd(project: Project, category: Category): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.summary || undefined,
    url: absoluteUrl(`/portfolio/${category.slug}/${project.slug}`),
    image: absoluteImage(project.coverImage),
    genre: category.name,
    dateCreated: project.year ? String(project.year) : undefined,
    locationCreated: project.location
      ? { "@type": "Place", name: project.location }
      : undefined,
    creator: { "@type": "Organization", name: "Characom Group" },
    creativeWorkStatus:
      project.status === "completed" ? "Published" : "InProgress",
  });
}

export function newsArticleJsonLd(post: NewsPost): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt || undefined,
    url: absoluteUrl(`/news/${post.slug}`),
    image: absoluteImage(post.coverImage),
    datePublished: post.publishedAt,
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    author: { "@type": "Organization", name: "Characom Group" },
    publisher: { "@type": "Organization", name: "Characom Group" },
    mainEntityOfPage: absoluteUrl(`/news/${post.slug}`),
  });
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
