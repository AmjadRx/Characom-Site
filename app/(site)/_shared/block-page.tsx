import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/registry";
import { getPage, getSettings } from "@/lib/content";
import type { ThemeColor } from "@/lib/content/types";

/**
 * Shared helpers for the block-rendered public routes (CONTRACTS.md — pages).
 * Every "getPage → BlockRenderer" route funnels through here so the
 * draft-mode / publish-status rules stay identical everywhere.
 */

/** CSS custom-property override for category theming (--accent family). */
export function themeVars(theme: ThemeColor): CSSProperties {
  const vars: Record<string, string> = { "--accent": `var(--${theme})` };
  if (theme === "gold") {
    vars["--accent-bright"] = "var(--gold-bright)";
    vars["--accent-deep"] = "var(--gold-deep)";
  } else {
    // cypress / aegean have no dedicated bright/deep tokens — derive the
    // bright variant, and both are dark enough to be AA text on plaster.
    vars["--accent-bright"] = `color-mix(in srgb, var(--${theme}) 65%, white)`;
    vars["--accent-deep"] = `var(--${theme})`;
  }
  return vars as CSSProperties;
}

interface SeoInput {
  title?: string;
  description?: string;
  ogImage?: string;
  /** bypass the "%s · Site" template (home page) */
  absoluteTitle?: boolean;
}

/** Build route Metadata from resolved SEO values. */
export function seoToMetadata({
  title,
  description,
  ogImage,
  absoluteTitle,
}: SeoInput): Metadata {
  const metadata: Metadata = {};
  if (title) metadata.title = absoluteTitle ? { absolute: title } : title;
  if (description) metadata.description = description;
  const openGraph: NonNullable<Metadata["openGraph"]> = {};
  if (title) openGraph.title = title;
  if (description) openGraph.description = description;
  if (ogImage) openGraph.images = [{ url: ogImage }];
  metadata.openGraph = openGraph;
  return metadata;
}

/** generateMetadata body for block-rendered pages: page.seo over seoDefaults. */
export async function blockPageMetadata(slug: string): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage(slug), getSettings()]);
  const defaults = settings.seoDefaults;
  const isHome = slug === "home";
  const title = isHome
    ? (page?.seo?.title ?? defaults.title ?? settings.siteName)
    : (page?.seo?.title ?? page?.title ?? defaults.title);
  return seoToMetadata({
    title,
    description: page?.seo?.description ?? defaults.description,
    ogImage: page?.seo?.ogImage ?? defaults.ogImage,
    absoluteTitle: isHome,
  });
}

/**
 * Renders a CMS page through the block registry.
 * 404s when the page is missing or unpublished — unless Next draft mode is
 * enabled, in which case the working copy (draftSections) is shown.
 */
export async function BlockPage({
  slug,
  pathname,
}: {
  slug: string;
  pathname: string;
}) {
  const [page, draft] = await Promise.all([getPage(slug), draftMode()]);
  if (!page) notFound();
  if (page.status !== "published" && !draft.isEnabled) notFound();
  const sections = draft.isEnabled
    ? (page.draftSections ?? page.sections)
    : page.sections;
  return <BlockRenderer sections={sections} ctx={{ pathname }} />;
}
