/**
 * Content model for the GitHub-backed CMS.
 * Content lives as JSON under /content and is read through lib/content.
 * These types are the single source of truth — admin and site both use them.
 */

export type Role = "owner" | "editor";

export type PublishStatus = "draft" | "published";

export interface SEO {
  title?: string;
  description?: string;
  ogImage?: string;
}

/* ── Rich text (Tiptap JSON document — never raw HTML) ─────────────────── */

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

export interface RichDoc {
  type: "doc";
  content?: RichNode[];
}

/* ── Pages & blocks ────────────────────────────────────────────────────── */

export interface Section {
  /** stable unique id within the page */
  id: string;
  /** block type key from lib/blocks/defs.ts */
  type: string;
  /** props validated by the block's Zod schema */
  props: Record<string, unknown>;
  visible: boolean;
}

export interface Page {
  title: string;
  /** "home" renders at /. May contain "/" (e.g. "legal/privacy"). */
  slug: string;
  status: PublishStatus;
  seo: SEO;
  /** live sections */
  sections: Section[];
  /** working copy; null/absent = no unpublished edits */
  draftSections?: Section[] | null;
  /** show in the admin "pages" nav picker */
  updatedAt: string;
}

/* ── Portfolio ─────────────────────────────────────────────────────────── */

export type ThemeColor = "gold" | "cypress" | "aegean";

export interface Category {
  id: string;
  name: string;
  slug: string;
  themeColor: ThemeColor;
  coverImage: string;
  coverImageAlt: string;
  intro: string;
  sortOrder: number;
}

export interface ProjectSpec {
  label: string;
  value: string;
}

export type GalleryLayout = "full" | "half" | "offset";

export interface ProjectImage {
  src: string;
  alt: string;
  layout: GalleryLayout;
  caption?: string;
}

export type ProjectStatus = "completed" | "in_progress";

export interface Project {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  location: string;
  year: number;
  status: ProjectStatus;
  client?: string;
  valueLabel?: string;
  summary: string;
  body: RichDoc;
  coverImage: string;
  coverImageAlt: string;
  specs: ProjectSpec[];
  images: ProjectImage[];
  videoEmbedUrl?: string;
  isFeatured: boolean;
  sortOrder: number;
  pageStatus: PublishStatus;
  seo?: SEO;
}

/* ── News ──────────────────────────────────────────────────────────────── */

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: RichDoc;
  coverImage: string;
  coverImageAlt: string;
  tags: string[];
  /** ISO date */
  publishedAt: string;
  status: PublishStatus;
}

/* ── Careers ───────────────────────────────────────────────────────────── */

export interface CareerPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  /** e.g. "Full-time" */
  type: string;
  description: RichDoc;
  isOpen: boolean;
  sortOrder: number;
}

/* ── Navigation ────────────────────────────────────────────────────────── */

export type NavMenu = "header" | "footer_1" | "footer_2" | "footer_3" | "social";

export interface NavigationItem {
  id: string;
  menu: NavMenu;
  label: string;
  /** internal path ("/portfolio") or absolute URL */
  href: string;
  newTab: boolean;
  sortOrder: number;
  /** one level of nesting, header menu only */
  children?: NavigationItem[];
}

export interface NavigationData {
  header: NavigationItem[];
  footer_1: NavigationItem[];
  footer_2: NavigationItem[];
  footer_3: NavigationItem[];
  social: NavigationItem[];
  footerColumnTitles: { footer_1: string; footer_2: string; footer_3: string };
}

/* ── Site settings (singleton) ─────────────────────────────────────────── */

export interface Office {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  foundedYear: number;
  contact: {
    phones: string[];
    emails: string[];
    fax?: string;
    offices: Office[];
  };
  branding: {
    /** wordmark text used when no logo image uploaded */
    logoText: string;
    logoImage?: string;
  };
  seoDefaults: SEO;
  stats: StatItem[];
  integrations: {
    analyticsId?: string;
    /** iframe src for the contact page map */
    mapEmbedUrl?: string;
  };
  heroMedia: {
    mode: "particles" | "video";
    videoSrc?: string;
    posterSrc?: string;
  };
  /** full-bleed construction photos behind the load screens (Preloader +
   * route transitions); empty = built-in placeholder set */
  loaderImages?: string[];
  maintenanceMode: boolean;
}

/* ── Media library ─────────────────────────────────────────────────────── */

export interface MediaItem {
  /** file name inside /media (e.g. "site-office.jpg") */
  file: string;
  alt: string;
  width?: number;
  height?: number;
  tags: string[];
  uploadedAt: string;
  uploadedBy?: string;
}

export interface MediaIndex {
  items: MediaItem[];
}

/* ── Inquiries ─────────────────────────────────────────────────────────── */

export type InquirySubject = "general" | "project" | "partnership" | "careers";

export type InquiryStatus = "new" | "read" | "replied" | "archived";

export interface Inquiry {
  id: string;
  subjectType: InquirySubject;
  name: string;
  email: string;
  phone?: string;
  message: string;
  sourcePage: string;
  status: InquiryStatus;
  consentAt: string;
  createdAt: string;
  repliedAt?: string;
}

/* ── Audit log ─────────────────────────────────────────────────────────── */

export interface AuditEntry {
  id: string;
  actor: string;
  entity: string;
  entityId: string;
  action: "create" | "update" | "delete" | "publish";
  at: string;
}
