import type { Page, Section } from "@/lib/content/types";
import { isRecord } from "./http";

/**
 * Zod-light validation for Page payloads coming from the admin builder.
 * Returns a normalized Page or null when structurally invalid.
 */

const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export function isValidPageSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && SLUG_RE.test(slug);
}

function isSection(value: unknown): value is Section {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    isRecord(value.props) &&
    typeof value.visible === "boolean"
  );
}

function isSectionArray(value: unknown): value is Section[] {
  return Array.isArray(value) && value.every(isSection);
}

export function parsePage(value: unknown): Page | null {
  if (!isRecord(value)) return null;
  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    return null;
  }
  if (!isValidPageSlug(value.slug)) return null;
  const status = value.status;
  if (status !== "draft" && status !== "published") return null;
  const seo = value.seo;
  if (!isRecord(seo)) return null;
  if (!isSectionArray(value.sections)) return null;

  let draftSections: Section[] | null = null;
  const draft = value.draftSections;
  if (draft !== undefined && draft !== null) {
    if (!isSectionArray(draft)) return null;
    draftSections = draft;
  }

  return {
    title: value.title,
    slug: value.slug,
    status,
    seo: seo as unknown as Page["seo"],
    sections: value.sections,
    draftSections,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
  };
}
