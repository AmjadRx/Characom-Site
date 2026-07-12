import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { getSource } from "./source";
import type {
  AuditEntry,
  CareerPosition,
  Category,
  Inquiry,
  MediaIndex,
  NavigationData,
  NewsPost,
  Page,
  Project,
  SiteSettings,
} from "./types";

/**
 * Typed content reads (cached, tag: "content") and writes (commit + revalidate).
 * Every public page renders exclusively through these functions.
 */

export const CONTENT_TAG = "content";

async function readJsonRaw<T>(filePath: string): Promise<T | null> {
  const raw = await getSource().read(filePath);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`[content] invalid JSON in ${filePath}`);
    return null;
  }
}

function cachedJson<T>(filePath: string): () => Promise<T | null> {
  return unstable_cache(() => readJsonRaw<T>(filePath), ["content", filePath], {
    tags: [CONTENT_TAG, `content:${filePath}`],
  });
}

async function writeJson(
  filePath: string,
  data: unknown,
  message: string,
): Promise<void> {
  await getSource().write(filePath, JSON.stringify(data, null, 2) + "\n", message);
  revalidateTag(CONTENT_TAG);
}

export function revalidateContent(): void {
  revalidateTag(CONTENT_TAG);
}

/* ── Settings ──────────────────────────────────────────────────────────── */

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Characom Group",
  tagline: "We build what outlasts us.",
  foundedYear: 1987,
  contact: { phones: [], emails: [], offices: [] },
  branding: { logoText: "CHARACOM" },
  seoDefaults: {
    title: "Characom Group — Building Cyprus",
    description:
      "Government infrastructure, real estate development and residential construction across Cyprus.",
  },
  stats: [],
  integrations: {},
  heroMedia: { mode: "particles" },
  loaderImages: [],
  maintenanceMode: false,
};

export async function getSettings(): Promise<SiteSettings> {
  const data = await cachedJson<SiteSettings>("content/settings.json")();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export async function saveSettings(
  settings: SiteSettings,
  actor: string,
): Promise<void> {
  await writeJson("content/settings.json", settings, `cms: update site settings`);
  await appendAudit(actor, "settings", "settings", "update");
}

/* ── Navigation ────────────────────────────────────────────────────────── */

const EMPTY_NAV: NavigationData = {
  header: [],
  footer_1: [],
  footer_2: [],
  footer_3: [],
  social: [],
  footerColumnTitles: {
    footer_1: "Sectors",
    footer_2: "Company",
    footer_3: "Offices",
  },
};

export async function getNavigation(): Promise<NavigationData> {
  const data = await cachedJson<NavigationData>("content/navigation.json")();
  return { ...EMPTY_NAV, ...(data ?? {}) };
}

export async function saveNavigation(
  nav: NavigationData,
  actor: string,
): Promise<void> {
  await writeJson("content/navigation.json", nav, "cms: update navigation");
  await appendAudit(actor, "navigation", "navigation", "update");
}

/* ── Portfolio ─────────────────────────────────────────────────────────── */

export async function getCategories(): Promise<Category[]> {
  const data = await cachedJson<Category[]>("content/categories.json")();
  return (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function saveCategories(
  categories: Category[],
  actor: string,
): Promise<void> {
  await writeJson("content/categories.json", categories, "cms: update categories");
  await appendAudit(actor, "categories", "categories", "update");
}

export async function getAllProjects(): Promise<Project[]> {
  const data = await cachedJson<Project[]>("content/projects.json")();
  return (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Published projects only (public site). */
export async function getProjects(filter?: {
  categorySlug?: string;
  featured?: boolean;
}): Promise<Project[]> {
  const [projects, categories] = await Promise.all([
    getAllProjects(),
    getCategories(),
  ]);
  let result = projects.filter((p) => p.pageStatus === "published");
  if (filter?.categorySlug) {
    const category = categories.find((c) => c.slug === filter.categorySlug);
    result = category ? result.filter((p) => p.categoryId === category.id) : [];
  }
  if (filter?.featured) result = result.filter((p) => p.isFeatured);
  return result;
}

export async function getProjectBySlug(
  categorySlug: string,
  projectSlug: string,
): Promise<Project | null> {
  const projects = await getProjects({ categorySlug });
  return projects.find((p) => p.slug === projectSlug) ?? null;
}

export async function saveProjects(
  projects: Project[],
  actor: string,
  message = "cms: update projects",
): Promise<void> {
  await writeJson("content/projects.json", projects, message);
  await appendAudit(actor, "projects", "projects", "update");
}

/* ── News ──────────────────────────────────────────────────────────────── */

export async function getAllNews(): Promise<NewsPost[]> {
  const data = await cachedJson<NewsPost[]>("content/news.json")();
  return (data ?? [])
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNews(limit?: number): Promise<NewsPost[]> {
  const posts = (await getAllNews()).filter((p) => p.status === "published");
  return limit ? posts.slice(0, limit) : posts;
}

export async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  const posts = await getNews();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function saveNews(
  posts: NewsPost[],
  actor: string,
  message = "cms: update news",
): Promise<void> {
  await writeJson("content/news.json", posts, message);
  await appendAudit(actor, "news", "news", "update");
}

/* ── Careers ───────────────────────────────────────────────────────────── */

export async function getAllCareers(): Promise<CareerPosition[]> {
  const data = await cachedJson<CareerPosition[]>("content/careers.json")();
  return (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getOpenPositions(): Promise<CareerPosition[]> {
  return (await getAllCareers()).filter((p) => p.isOpen);
}

export async function saveCareers(
  positions: CareerPosition[],
  actor: string,
): Promise<void> {
  await writeJson("content/careers.json", positions, "cms: update careers");
  await appendAudit(actor, "careers", "careers", "update");
}

/* ── Pages ─────────────────────────────────────────────────────────────── */

function pagePath(slug: string): string {
  // slugs may contain "/" (e.g. legal/privacy) → nested files
  const safe = slug
    .split("/")
    .map((s) => s.replace(/[^a-z0-9-]/gi, ""))
    .filter(Boolean)
    .join("/");
  return `content/pages/${safe || "home"}.json`;
}

export async function getPage(slug: string): Promise<Page | null> {
  return cachedJson<Page>(pagePath(slug))();
}

export async function getPageIndex(): Promise<
  { slug: string; title: string; status: string; updatedAt: string }[]
> {
  const data =
    await cachedJson<
      { slug: string; title: string; status: string; updatedAt: string }[]
    >("content/pages-index.json")();
  return data ?? [];
}

export async function savePage(page: Page, actor: string): Promise<void> {
  await writeJson(pagePath(page.slug), page, `cms: update page "${page.slug}"`);
  const index = (await getPageIndex()).filter((p) => p.slug !== page.slug);
  index.push({
    slug: page.slug,
    title: page.title,
    status: page.status,
    updatedAt: page.updatedAt,
  });
  index.sort((a, b) => a.slug.localeCompare(b.slug));
  await writeJson("content/pages-index.json", index, "cms: update page index");
  await appendAudit(actor, "page", page.slug, "update");
}

export async function deletePage(slug: string, actor: string): Promise<void> {
  await getSource().remove(pagePath(slug), `cms: delete page "${slug}"`);
  const index = (await getPageIndex()).filter((p) => p.slug !== slug);
  await writeJson("content/pages-index.json", index, "cms: update page index");
  revalidateTag(CONTENT_TAG);
  await appendAudit(actor, "page", slug, "delete");
}

/* ── Inquiries (one JSON file per inquiry) ─────────────────────────────── */

export async function getInquiries(): Promise<Inquiry[]> {
  const source = getSource();
  const files = await source.list("content/inquiries");
  const inquiries = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        const raw = await source.read(`content/inquiries/${f}`);
        if (!raw) return null;
        try {
          return JSON.parse(raw) as Inquiry;
        } catch {
          return null;
        }
      }),
  );
  return inquiries
    .filter((i): i is Inquiry => i !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveInquiry(inquiry: Inquiry): Promise<void> {
  await getSource().write(
    `content/inquiries/${inquiry.id}.json`,
    JSON.stringify(inquiry, null, 2) + "\n",
    `inquiry: ${inquiry.subjectType} from website`,
  );
}

export async function updateInquiry(inquiry: Inquiry): Promise<void> {
  await getSource().write(
    `content/inquiries/${inquiry.id}.json`,
    JSON.stringify(inquiry, null, 2) + "\n",
    `cms: update inquiry ${inquiry.id}`,
  );
}

/* ── Media library ─────────────────────────────────────────────────────── */

export async function getMediaIndex(): Promise<MediaIndex> {
  const data = await cachedJson<MediaIndex>("content/media.json")();
  return data ?? { items: [] };
}

export async function saveMediaIndex(
  index: MediaIndex,
  actor: string,
): Promise<void> {
  await writeJson("content/media.json", index, "cms: update media index");
  await appendAudit(actor, "media", "index", "update");
}

/* ── Audit log ─────────────────────────────────────────────────────────── */

export async function getAuditLog(): Promise<AuditEntry[]> {
  const data = await readJsonRaw<AuditEntry[]>("content/audit-log.json");
  return data ?? [];
}

export async function appendAudit(
  actor: string,
  entity: string,
  entityId: string,
  action: AuditEntry["action"],
): Promise<void> {
  try {
    const log = await getAuditLog();
    log.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor,
      entity,
      entityId,
      action,
      at: new Date().toISOString(),
    });
    await getSource().write(
      "content/audit-log.json",
      JSON.stringify(log.slice(0, 300), null, 2) + "\n",
      "cms: audit log",
    );
  } catch (err) {
    // Audit must never block a save.
    console.error("[content] audit append failed", err);
  }
}
