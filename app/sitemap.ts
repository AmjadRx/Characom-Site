import type { MetadataRoute } from "next";
import {
  getCategories,
  getNews,
  getPageIndex,
  getProjects,
} from "@/lib/content/store";
import { absoluteUrl } from "@/lib/seo";

/**
 * XML sitemap generated from published content. Admin, API and dev routes
 * are excluded (also disallowed in robots.ts).
 */

const STATIC_ROUTES = [
  "/",
  "/portfolio",
  "/about",
  "/news",
  "/contact",
  "/careers",
  "/certifications",
  "/partners",
];

const EXCLUDED_PREFIXES = ["admin", "api", "dev"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const add = (
    path: string,
    lastModified?: string | Date,
    priority?: number,
  ) => {
    const url = absoluteUrl(path);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
      ...(priority !== undefined ? { priority } : {}),
    });
  };

  for (const route of STATIC_ROUTES) {
    add(route, undefined, route === "/" ? 1 : 0.8);
  }

  try {
    const [categories, projects, news, pageIndex] = await Promise.all([
      getCategories(),
      getProjects(),
      getNews(),
      getPageIndex(),
    ]);

    const categoryById = new Map(categories.map((c) => [c.id, c]));

    for (const category of categories) {
      add(`/portfolio/${category.slug}`, undefined, 0.8);
    }
    for (const project of projects) {
      const category = categoryById.get(project.categoryId);
      if (!category) continue;
      add(`/portfolio/${category.slug}/${project.slug}`, undefined, 0.7);
    }
    for (const post of news) {
      add(`/news/${post.slug}`, post.publishedAt, 0.6);
    }
    for (const page of pageIndex) {
      if (page.status !== "published") continue;
      const first = page.slug.split("/")[0];
      if (EXCLUDED_PREFIXES.includes(first)) continue;
      add(page.slug === "home" ? "/" : `/${page.slug}`, page.updatedAt, 0.5);
    }
  } catch (err) {
    // Content source unavailable — still emit the static routes.
    console.error("[sitemap] content read failed:", err);
  }

  return entries;
}
