import { z } from "zod";
import type { RichDoc } from "@/lib/content/types";

/**
 * Block registry contract (ARCHITECTURE.md §7.2).
 * Each block declares:
 *  - a Zod schema (validation on save + safe parse on render)
 *  - `fields` — declarative admin form definition (auto-generated edit UI)
 *  - `defaults` — valid starting props when a block is added to a page
 * Public components live in components/blocks/* and are mapped to these
 * types in components/blocks/registry.tsx.
 */

/* ── Field definitions for the admin form generator ────────────────────── */

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "number"
  | "boolean"
  | "select"
  | "link"
  | "list";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  /** prop name (dot paths not supported — nest only via "list"/"link"/"image") */
  name: string;
  label: string;
  kind: FieldKind;
  help?: string;
  /** for kind "select" */
  options?: FieldOption[];
  /** for kind "list": scalar-kind fields of each item (no nested lists) */
  itemFields?: FieldDef[];
  /** for kind "list": singular label, e.g. "Milestone" */
  itemLabel?: string;
}

/* ── Shared sub-schemas ────────────────────────────────────────────────── */

export const linkSchema = z.object({
  label: z.string().default(""),
  href: z.string().default("/"),
  variant: z.enum(["gold", "ghost", "text"]).default("gold"),
  newTab: z.boolean().default(false),
});
export type LinkProps = z.infer<typeof linkSchema>;

export const imageSchema = z.object({
  src: z.string().default(""),
  alt: z.string().default(""),
});
export type ImageProps = z.infer<typeof imageSchema>;

export const richDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.any()).optional(),
  })
  .default({ type: "doc", content: [] }) as z.ZodType<RichDoc>;

export const themeSchema = z.enum(["gold", "cypress", "aegean"]);

const THEME_OPTIONS: FieldOption[] = [
  { label: "Gold (Residential)", value: "gold" },
  { label: "Deep green (Government)", value: "cypress" },
  { label: "Royal purple (Real Estate)", value: "aegean" },
];

const linkFields = (name: string, label: string): FieldDef => ({
  name,
  label,
  kind: "link",
});

const kickerField: FieldDef = { name: "kicker", label: "Kicker", kind: "text" };
const headingField: FieldDef = { name: "heading", label: "Heading", kind: "text" };
const darkField: FieldDef = {
  name: "dark",
  label: "Dark (ink) background",
  kind: "boolean",
};

/* ── Block definitions ─────────────────────────────────────────────────── */

export const BLOCK_TYPES = [
  "hero",
  "pageHero",
  "constructionScene",
  "statsCounters",
  "richText",
  "imageWithText",
  "sectorCards",
  "featuredProjects",
  "categoryPanels",
  "projectGrid",
  "timeline",
  "teamGrid",
  "logoWall",
  "testimonials",
  "newsList",
  "faq",
  "ctaBand",
  "contactMethods",
  "contactForm",
  "mapEmbed",
  "fileDownload",
  "careersList",
  "spacer",
  "rawEmbed",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface BlockDef {
  type: BlockType;
  label: string;
  description: string;
  /** only "owner" role may add/edit (raw HTML) */
  ownerOnly?: boolean;
  schema: z.ZodType<Record<string, unknown>>;
  defaults: Record<string, unknown>;
  fields: FieldDef[];
}

function def<T extends z.ZodRawShape>(
  type: BlockType,
  label: string,
  description: string,
  shape: T,
  defaults: z.infer<z.ZodObject<T>>,
  fields: FieldDef[],
  ownerOnly = false,
): BlockDef {
  return {
    type,
    label,
    description,
    ownerOnly,
    schema: z.object(shape).passthrough() as unknown as z.ZodType<
      Record<string, unknown>
    >,
    defaults: defaults as Record<string, unknown>,
    fields,
  };
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  hero: def(
    "hero",
    "Cinematic hero",
    "100vh hero with particle/video background, split-text headline and CTA buttons.",
    {
      kicker: z.string().default(""),
      headline: z.string().default(""),
      subheadline: z.string().default(""),
      buttons: z.array(linkSchema).default([]),
      media: z
        .object({
          mode: z.enum(["particles", "video", "image"]).default("particles"),
          videoSrc: z.string().default(""),
          posterSrc: z.string().default(""),
          image: imageSchema.default({ src: "", alt: "" }),
        })
        .default({
          mode: "particles",
          videoSrc: "",
          posterSrc: "",
          image: { src: "", alt: "" },
        }),
      showScrollCue: z.boolean().default(true),
    },
    {
      kicker: "CHARACOM GROUP — BUILDING CYPRUS",
      headline: "We build what outlasts us.",
      subheadline: "",
      buttons: [],
      media: {
        mode: "particles",
        videoSrc: "",
        posterSrc: "",
        image: { src: "", alt: "" },
      },
      showScrollCue: true,
    },
    [
      kickerField,
      { name: "headline", label: "Headline", kind: "textarea" },
      { name: "subheadline", label: "Subheadline", kind: "text" },
      {
        name: "buttons",
        label: "Buttons",
        kind: "list",
        itemLabel: "Button",
        itemFields: [
          { name: "label", label: "Label", kind: "text" },
          { name: "href", label: "Link", kind: "text" },
          {
            name: "variant",
            label: "Style",
            kind: "select",
            options: [
              { label: "Gold filled", value: "gold" },
              { label: "Ghost outline", value: "ghost" },
            ],
          },
        ],
      },
      { name: "showScrollCue", label: "Show scroll cue", kind: "boolean" },
    ],
  ),

  pageHero: def(
    "pageHero",
    "Page hero (short)",
    "40vh inner-page hero: kicker, display heading, optional subline; themable.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      subheading: z.string().default(""),
      theme: themeSchema.default("gold"),
      dark: z.boolean().default(false),
      image: imageSchema.default({ src: "", alt: "" }),
    },
    {
      kicker: "",
      heading: "",
      subheading: "",
      theme: "gold",
      dark: false,
      image: { src: "", alt: "" },
    },
    [
      kickerField,
      headingField,
      { name: "subheading", label: "Subheading", kind: "text" },
      { name: "theme", label: "Theme color", kind: "select", options: THEME_OPTIONS },
      darkField,
      {
        name: "image",
        label: "Background photo (full-bleed with scrim)",
        kind: "image",
      },
    ],
  ),

  constructionScene: def(
    "constructionScene",
    "3D construction timelapse",
    "Scroll-driven isometric 3D build scene (tower with per-floor reasons, or a residential mansion with crew, vehicles and trees). Pure CSS 3D, no libraries.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      text: z.string().default(""),
      variant: z.enum(["tower", "mansion"]).default("tower"),
      floors: z.number().min(4).max(20).default(12),
      caption: z.string().default(""),
      reasons: z
        .array(
          z.object({
            title: z.string().default(""),
            text: z.string().default(""),
          }),
        )
        .default([]),
    },
    {
      kicker: "The build, distilled",
      heading: "From ground to skyline",
      text: "",
      variant: "tower",
      floors: 12,
      caption: "Scroll to raise the tower",
      reasons: [],
    },
    [
      kickerField,
      headingField,
      { name: "text", label: "Supporting text", kind: "text" },
      {
        name: "variant",
        label: "Scene",
        kind: "select",
        options: [
          { label: "Corporate tower (with reasons per floor)", value: "tower" },
          { label: "Residential mansion (crew, vehicles, trees)", value: "mansion" },
        ],
      },
      {
        name: "floors",
        label: "Floors (tower only)",
        kind: "number",
        help: "4 to 20. Scroll builds the tower floor by floor.",
      },
      { name: "caption", label: "Caption under the scene", kind: "text" },
      {
        name: "reasons",
        label: "Reasons (tower: one revealed per floor)",
        kind: "list",
        itemLabel: "Reason",
        itemFields: [
          { name: "title", label: "Title", kind: "text" },
          { name: "text", label: "Detail line", kind: "textarea" },
        ],
      },
    ],
  ),

  statsCounters: def(
    "statsCounters",
    "Stat counters",
    "Animated counting numbers band. Uses site-settings stats or its own list.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      useSiteStats: z.boolean().default(true),
      items: z
        .array(
          z.object({
            label: z.string().default(""),
            value: z.number().default(0),
            suffix: z.string().default("+"),
          }),
        )
        .default([]),
      dark: z.boolean().default(true),
    },
    { kicker: "", heading: "", useSiteStats: true, items: [], dark: true },
    [
      kickerField,
      headingField,
      {
        name: "useSiteStats",
        label: "Use stats from Site Settings",
        kind: "boolean",
      },
      {
        name: "items",
        label: "Custom stats (when not using Site Settings)",
        kind: "list",
        itemLabel: "Stat",
        itemFields: [
          { name: "label", label: "Label", kind: "text" },
          { name: "value", label: "Value", kind: "number" },
          { name: "suffix", label: "Suffix", kind: "text" },
        ],
      },
      darkField,
    ],
  ),

  richText: def(
    "richText",
    "Rich text",
    "Editorial rich-text column.",
    {
      kicker: z.string().default(""),
      body: richDocSchema,
      maxWidth: z.enum(["narrow", "wide"]).default("narrow"),
      dark: z.boolean().default(false),
    },
    {
      kicker: "",
      body: { type: "doc", content: [] },
      maxWidth: "narrow",
      dark: false,
    },
    [
      kickerField,
      { name: "body", label: "Body", kind: "richtext" },
      {
        name: "maxWidth",
        label: "Column width",
        kind: "select",
        options: [
          { label: "Narrow (editorial)", value: "narrow" },
          { label: "Wide", value: "wide" },
        ],
      },
      darkField,
    ],
  ),

  imageWithText: def(
    "imageWithText",
    "Image + text",
    "Editorial paragraph with reading-light line reveal beside a parallax image.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      body: z.string().default(""),
      image: imageSchema.default({ src: "", alt: "" }),
      imageSide: z.enum(["left", "right"]).default("right"),
      link: linkSchema.optional(),
      dark: z.boolean().default(false),
    },
    {
      kicker: "",
      heading: "",
      body: "",
      image: { src: "", alt: "" },
      imageSide: "right",
      dark: false,
    },
    [
      kickerField,
      headingField,
      {
        name: "body",
        label: "Body text",
        kind: "textarea",
        help: "Blank line = new paragraph. Lines brighten as they cross the viewport.",
      },
      { name: "image", label: "Image", kind: "image" },
      {
        name: "imageSide",
        label: "Image side",
        kind: "select",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
      },
      linkFields("link", "Text link (optional)"),
      darkField,
    ],
  ),

  sectorCards: def(
    "sectorCards",
    "Sector cards",
    "Three themed tilt cards. Auto-fills from portfolio categories or custom cards.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      useCategories: z.boolean().default(true),
      cards: z
        .array(
          z.object({
            title: z.string().default(""),
            text: z.string().default(""),
            image: imageSchema.default({ src: "", alt: "" }),
            href: z.string().default("/"),
            theme: themeSchema.default("gold"),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", useCategories: true, cards: [] },
    [
      kickerField,
      headingField,
      {
        name: "useCategories",
        label: "Auto-fill from portfolio categories",
        kind: "boolean",
      },
      {
        name: "cards",
        label: "Custom cards",
        kind: "list",
        itemLabel: "Card",
        itemFields: [
          { name: "title", label: "Title", kind: "text" },
          { name: "text", label: "One-liner", kind: "text" },
          { name: "image", label: "Image", kind: "image" },
          { name: "href", label: "Link", kind: "text" },
          { name: "theme", label: "Theme", kind: "select", options: THEME_OPTIONS },
        ],
      },
    ],
  ),

  featuredProjects: def(
    "featuredProjects",
    "Featured projects showcase",
    "Pinned horizontal scroll of flagship projects (marked Featured in Projects).",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      limit: z.number().min(1).max(8).default(5),
    },
    { kicker: "Selected work", heading: "Featured projects", limit: 5 },
    [
      kickerField,
      headingField,
      {
        name: "limit",
        label: "Max projects",
        kind: "number",
        help: "Shows projects marked as Featured, in their sort order.",
      },
    ],
  ),

  categoryPanels: def(
    "categoryPanels",
    "Category panels",
    "Full-width Ken Burns panel per portfolio category (auto).",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
    },
    { kicker: "", heading: "" },
    [kickerField, headingField],
  ),

  projectGrid: def(
    "projectGrid",
    "Project grid",
    "Filterable FLIP grid of projects. Leave category empty on category pages (auto).",
    {
      categorySlug: z.string().default(""),
      showFilters: z.boolean().default(true),
    },
    { categorySlug: "", showFilters: true },
    [
      {
        name: "categorySlug",
        label: "Category slug (empty = from page context / all)",
        kind: "text",
      },
      { name: "showFilters", label: "Show filter bar", kind: "boolean" },
    ],
  ),

  timeline: def(
    "timeline",
    "Timeline",
    "Milestone timeline with a self-drawing gold line. Compact = horizontal teaser strip.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      milestones: z
        .array(
          z.object({
            year: z.string().default(""),
            title: z.string().default(""),
            text: z.string().default(""),
          }),
        )
        .default([]),
      compact: z.boolean().default(false),
      link: linkSchema.optional(),
    },
    { kicker: "", heading: "", milestones: [], compact: false },
    [
      kickerField,
      headingField,
      {
        name: "milestones",
        label: "Milestones",
        kind: "list",
        itemLabel: "Milestone",
        itemFields: [
          { name: "year", label: "Year", kind: "text" },
          { name: "title", label: "Title", kind: "text" },
          { name: "text", label: "Text", kind: "textarea" },
        ],
      },
      { name: "compact", label: "Compact teaser strip", kind: "boolean" },
      linkFields("link", "Link (optional)"),
    ],
  ),

  teamGrid: def(
    "teamGrid",
    "Team grid",
    "Leadership grid — hover reveals bio.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      members: z
        .array(
          z.object({
            name: z.string().default(""),
            role: z.string().default(""),
            photo: imageSchema.default({ src: "", alt: "" }),
            bio: z.string().default(""),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", members: [] },
    [
      kickerField,
      headingField,
      {
        name: "members",
        label: "Members",
        kind: "list",
        itemLabel: "Member",
        itemFields: [
          { name: "name", label: "Name", kind: "text" },
          { name: "role", label: "Role", kind: "text" },
          { name: "photo", label: "Photo", kind: "image" },
          { name: "bio", label: "Bio", kind: "textarea" },
        ],
      },
    ],
  ),

  logoWall: def(
    "logoWall",
    "Logo wall",
    "Partner/client logos — grayscale, color on hover.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      logos: z
        .array(
          z.object({
            name: z.string().default(""),
            image: imageSchema.default({ src: "", alt: "" }),
            href: z.string().default(""),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", logos: [] },
    [
      kickerField,
      headingField,
      {
        name: "logos",
        label: "Logos",
        kind: "list",
        itemLabel: "Logo",
        itemFields: [
          { name: "name", label: "Name", kind: "text" },
          { name: "image", label: "Logo image", kind: "image" },
          { name: "href", label: "Link (optional)", kind: "text" },
        ],
      },
    ],
  ),

  testimonials: def(
    "testimonials",
    "Testimonials",
    "Quote slider.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      items: z
        .array(
          z.object({
            quote: z.string().default(""),
            author: z.string().default(""),
            role: z.string().default(""),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", items: [] },
    [
      kickerField,
      headingField,
      {
        name: "items",
        label: "Quotes",
        kind: "list",
        itemLabel: "Quote",
        itemFields: [
          { name: "quote", label: "Quote", kind: "textarea" },
          { name: "author", label: "Author", kind: "text" },
          { name: "role", label: "Role / company", kind: "text" },
        ],
      },
    ],
  ),

  newsList: def(
    "newsList",
    "News list",
    "Latest articles as minimal hover-preview rows.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      limit: z.number().min(1).max(24).default(3),
      showAllLink: z.boolean().default(true),
    },
    { kicker: "Newsroom", heading: "Latest news", limit: 3, showAllLink: true },
    [
      kickerField,
      headingField,
      { name: "limit", label: "Number of articles", kind: "number" },
      { name: "showAllLink", label: "Show “All news” link", kind: "boolean" },
    ],
  ),

  faq: def(
    "faq",
    "FAQ accordion",
    "Accessible accordion of questions and answers.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      items: z
        .array(
          z.object({
            question: z.string().default(""),
            answer: z.string().default(""),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", items: [] },
    [
      kickerField,
      headingField,
      {
        name: "items",
        label: "Questions",
        kind: "list",
        itemLabel: "Question",
        itemFields: [
          { name: "question", label: "Question", kind: "text" },
          { name: "answer", label: "Answer", kind: "textarea" },
        ],
      },
    ],
  ),

  ctaBand: def(
    "ctaBand",
    "CTA band",
    "Ink band with gold gradient mesh and a morphing CTA button.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      text: z.string().default(""),
      button: linkSchema.default({
        label: "Get in touch",
        href: "/contact",
        variant: "gold",
        newTab: false,
      }),
      image: imageSchema.default({ src: "", alt: "" }),
    },
    {
      kicker: "",
      heading: "Have a project in mind?",
      text: "",
      button: { label: "Get in touch", href: "/contact", variant: "gold", newTab: false },
      image: { src: "", alt: "" },
    },
    [
      kickerField,
      headingField,
      { name: "text", label: "Supporting text", kind: "text" },
      linkFields("button", "Button"),
      {
        name: "image",
        label: "Background photo (optional, behind the gold mesh)",
        kind: "image",
      },
    ],
  ),

  contactMethods: def(
    "contactMethods",
    "Contact methods",
    "Phone / email / fax / address cards from Site Settings, with copy-to-clipboard.",
    {
      showOffices: z.boolean().default(true),
    },
    { showOffices: true },
    [{ name: "showOffices", label: "Show office list", kind: "boolean" }],
  ),

  contactForm: def(
    "contactForm",
    "Contact form",
    "Validated inquiry form → stored + optional email notification.",
    {
      heading: z.string().default(""),
      text: z.string().default(""),
    },
    { heading: "Tell us about your project", text: "" },
    [
      headingField,
      { name: "text", label: "Intro text", kind: "text" },
    ],
  ),

  mapEmbed: def(
    "mapEmbed",
    "Map embed",
    "Dark-styled lazy map iframe. Empty URL = map from Site Settings.",
    {
      embedUrl: z.string().default(""),
    },
    { embedUrl: "" },
    [
      {
        name: "embedUrl",
        label: "Embed URL (optional)",
        kind: "text",
        help: "Leave empty to use the map configured in Site Settings.",
      },
    ],
  ),

  fileDownload: def(
    "fileDownload",
    "File downloads",
    "Company profile / tender document download cards.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      files: z
        .array(
          z.object({
            label: z.string().default(""),
            href: z.string().default(""),
            note: z.string().default(""),
          }),
        )
        .default([]),
    },
    { kicker: "", heading: "", files: [] },
    [
      kickerField,
      headingField,
      {
        name: "files",
        label: "Files",
        kind: "list",
        itemLabel: "File",
        itemFields: [
          { name: "label", label: "Label", kind: "text" },
          { name: "href", label: "File URL", kind: "text" },
          { name: "note", label: "Note (e.g. PDF · 4MB)", kind: "text" },
        ],
      },
    ],
  ),

  careersList: def(
    "careersList",
    "Open positions",
    "Open roles from the Careers collection, with apply links.",
    {
      kicker: z.string().default(""),
      heading: z.string().default(""),
      emptyText: z
        .string()
        .default("No open positions right now — check back soon."),
    },
    {
      kicker: "Join us",
      heading: "Open positions",
      emptyText: "No open positions right now — check back soon.",
    },
    [
      kickerField,
      headingField,
      { name: "emptyText", label: "Empty-state text", kind: "text" },
    ],
  ),

  spacer: def(
    "spacer",
    "Spacer / divider",
    "Vertical space, optionally with a hairline divider.",
    {
      size: z.enum(["sm", "md", "lg"]).default("md"),
      showDivider: z.boolean().default(false),
    },
    { size: "md", showDivider: false },
    [
      {
        name: "size",
        label: "Size",
        kind: "select",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      { name: "showDivider", label: "Show divider line", kind: "boolean" },
    ],
  ),

  rawEmbed: def(
    "rawEmbed",
    "Raw embed (owner only)",
    "Raw HTML embed — owner role only.",
    {
      html: z.string().default(""),
    },
    { html: "" },
    [{ name: "html", label: "HTML", kind: "textarea" }],
    true,
  ),
};

/** Parse + default-fill block props; returns null when invalid. */
export function parseBlockProps(
  type: string,
  props: unknown,
): Record<string, unknown> | null {
  const blockDef = BLOCK_DEFS[type as BlockType];
  if (!blockDef) return null;
  const parsed = blockDef.schema.safeParse(props ?? {});
  if (!parsed.success) return null;
  return { ...blockDef.defaults, ...parsed.data };
}

export function isBlockType(type: string): type is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(type);
}
