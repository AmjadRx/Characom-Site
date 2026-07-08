import type { FieldDef } from "@/lib/blocks/defs";
import type { RichDoc } from "@/lib/content/types";
import { EMPTY_IMAGE, type ImageValue } from "./ImageField";
import { EMPTY_LINK, type LinkValue } from "./LinkField";

/**
 * Loose-value coercion: block props arrive as `unknown` from JSON — every
 * field renders a sensible control even for missing/mistyped values.
 */

export function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function asNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

export function asLink(value: unknown): LinkValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Partial<LinkValue>;
    return {
      label: asString(v.label),
      href: asString(v.href) || "/",
      variant:
        v.variant === "ghost" || v.variant === "text" ? v.variant : "gold",
      newTab: Boolean(v.newTab),
    };
  }
  return { ...EMPTY_LINK };
}

export function asImage(value: unknown): ImageValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Partial<ImageValue>;
    return { src: asString(v.src), alt: asString(v.alt) };
  }
  return { ...EMPTY_IMAGE };
}

export function asList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

export function asRichDoc(value: unknown): RichDoc {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "doc"
  ) {
    return value as RichDoc;
  }
  return { type: "doc", content: [] };
}

/** Default value for a freshly-added list row, derived from its fields. */
export function defaultItemFor(fields: FieldDef[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    switch (field.kind) {
      case "number":
        item[field.name] = 0;
        break;
      case "boolean":
        item[field.name] = false;
        break;
      case "select":
        item[field.name] = field.options?.[0]?.value ?? "";
        break;
      case "image":
        item[field.name] = { ...EMPTY_IMAGE };
        break;
      case "link":
        item[field.name] = { ...EMPTY_LINK };
        break;
      case "richtext":
        item[field.name] = { type: "doc", content: [] };
        break;
      default:
        item[field.name] = "";
    }
  }
  return item;
}
