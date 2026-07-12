import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getCategoryBySlug,
  getProjectBySlug,
  getProjects,
  getSettings,
} from "@/lib/content";
import type { Project } from "@/lib/content/types";
import { isEmptyRichDoc } from "@/lib/content/rich-text";
import { projectJsonLd } from "@/lib/seo";
import { STAGGER } from "@/lib/motion/constants";
import { Reveal, SplitTextReveal } from "@/components/motion";
import RichText from "@/components/ui/RichText";
import { seoToMetadata, themeVars } from "../../../_shared/block-page";
import CaseCover from "./_components/CaseCover";
import CaseGallery from "./_components/CaseGallery";
import NextProject from "./_components/NextProject";

/**
 * Cinematic project case study (ARCHITECTURE §5.4) — composed directly,
 * not page-builder driven: cover zoom-out hero, split-text title, meta row,
 * two-column spec sheet with sticky fact table, editorial gallery with
 * lightbox, optional video embed, next-project footer.
 */

export const revalidate = 300;

interface ProjectPageProps {
  params: Promise<{ category: string; project: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  const perCategory = await Promise.all(
    categories.map(async (category) => {
      const projects = await getProjects({ categorySlug: category.slug });
      return projects.map((project) => ({
        category: category.slug,
        project: project.slug,
      }));
    }),
  );
  return perCategory.flat();
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { category: categorySlug, project: projectSlug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(categorySlug, projectSlug),
    getSettings(),
  ]);
  if (!project) return {};
  return seoToMetadata({
    title: project.seo?.title ?? `${project.name} — ${project.location}`,
    description:
      project.seo?.description ||
      project.summary ||
      settings.seoDefaults.description,
    ogImage: project.seo?.ogImage || project.coverImage,
  });
}

function statusLabel(status: Project["status"]): string {
  return status === "completed" ? "Completed" : "In progress";
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { category: categorySlug, project: projectSlug } = await params;
  const [category, project] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getProjectBySlug(categorySlug, projectSlug),
  ]);
  if (!category || !project) notFound();

  // Next project in the same category (sort order, wrapping) for the footer.
  const siblings = await getProjects({ categorySlug });
  const index = siblings.findIndex((p) => p.slug === project.slug);
  const next =
    siblings.length > 1 && index >= 0
      ? siblings[(index + 1) % siblings.length]
      : null;

  const meta = [
    { label: "Location", value: project.location },
    { label: "Year", value: project.year ? String(project.year) : "" },
    { label: "Status", value: statusLabel(project.status) },
    { label: "Client", value: project.client ?? "" },
    { label: "Value", value: project.valueLabel ?? "" },
  ].filter((item) => item.value !== "");

  const specs = project.specs.filter((s) => s.label && s.value);
  const hasBody = !isEmptyRichDoc(project.body);

  return (
    <div style={themeVars(category.themeColor)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectJsonLd(project, category)),
        }}
      />

      {/* ── Hero: full-bleed cover, zoom-out on load ─────────────────── */}
      <section
        className="on-dark relative flex min-h-[92svh] items-end overflow-hidden bg-ink text-plaster"
        data-nav-theme="dark"
      >
        <CaseCover src={project.coverImage} alt={project.coverImageAlt} />
        <div className="container-site relative z-10 pb-16 pt-48 md:pb-20">
          <Reveal variant="fade">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-plaster/70">
                <li>
                  <Link href="/portfolio" className="link-underline">
                    Portfolio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/portfolio/${category.slug}`}
                    className="link-underline"
                  >
                    {category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-plaster">
                  {project.name}
                </li>
              </ol>
            </nav>
          </Reveal>
          <SplitTextReveal
            text={project.name}
            as="h1"
            className="text-display-1 mt-6 max-w-5xl text-plaster"
            delay={0.15}
          />
          {meta.length > 0 ? (
            <Reveal variant="rise" delay={0.35}>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-6">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-plaster/60">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-display font-semibold text-plaster">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* ── Spec sheet: narrative left, sticky fact table right ─────── */}
      <section className="section-pad bg-plaster">
        <div
          className={
            specs.length > 0
              ? "container-site grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]"
              : "container-site"
          }
        >
          <div className="max-w-[68ch]">
            <Reveal variant="fade">
              <p className="kicker kicker--accent">Case study</p>
            </Reveal>
            {project.summary ? (
              <Reveal variant="rise" delay={0.1}>
                <p className="mt-6 font-display leading-snug text-ink [font-size:var(--text-h3)]">
                  {project.summary}
                </p>
              </Reveal>
            ) : null}
            {hasBody ? (
              <Reveal variant="fade" delay={0.2}>
                <RichText doc={project.body} className="mt-8" />
              </Reveal>
            ) : null}
          </div>

          {specs.length > 0 ? (
            <aside
              aria-label="Project facts"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="rounded-card border border-ink/10 bg-white p-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone">
                  Project facts
                </h2>
                <div className="mt-4">
                  {specs.map((spec, i) => (
                    <Reveal
                      key={`${spec.label}-${i}`}
                      variant="fade"
                      delay={i * STAGGER.listRows}
                    >
                      <div
                        className={
                          i === specs.length - 1
                            ? "flex items-baseline justify-between gap-6 py-3"
                            : "flex items-baseline justify-between gap-6 border-b border-ink/10 py-3"
                        }
                      >
                        <span className="text-sm text-stone">{spec.label}</span>
                        <span className="text-right text-sm font-semibold text-ink">
                          {spec.value}
                        </span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      {/* ── Editorial gallery ────────────────────────────────────────── */}
      {project.images.length > 0 ? (
        <section
          aria-label={`${project.name} gallery`}
          className="pb-[var(--section-pad)]"
        >
          <CaseGallery images={project.images} projectName={project.name} />
        </section>
      ) : null}

      {/* ── Optional video ───────────────────────────────────────────── */}
      {project.videoEmbedUrl ? (
        <section
          aria-label={`${project.name} video`}
          className="container-site pb-[var(--section-pad)]"
        >
          <Reveal variant="clip">
            <div className="relative aspect-video overflow-hidden rounded-card bg-ink">
              <iframe
                src={project.videoEmbedUrl}
                title={`${project.name} — project video`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* ── Next project footer ──────────────────────────────────────── */}
      {next ? <NextProject project={next} categorySlug={category.slug} /> : null}
    </div>
  );
}
