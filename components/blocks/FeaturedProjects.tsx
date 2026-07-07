import Image from "next/image";
import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import { getCategories, getProjects } from "@/lib/content";
import { PinnedScene, Parallax } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";

interface FeaturedProjectsProps {
  kicker?: string;
  heading?: string;
  limit?: number;
}

/**
 * §5.1.5 Featured projects — dark pinned horizontal showcase.
 * PinnedScene pins + scrubs the slides horizontally on ≥1024px and falls
 * back to a vertical stack below that / under reduced motion. Each slide:
 * full-height cover, oversized index number parallaxing at its own rate,
 * name + location and a full-slide "view case study" link.
 */
export default async function FeaturedProjects({ props }: BlockComponentProps) {
  const p = props as FeaturedProjectsProps;
  const limit =
    typeof p.limit === "number" && p.limit > 0 ? Math.min(p.limit, 8) : 5;

  const [featured, categories] = await Promise.all([
    getProjects({ featured: true }),
    getCategories(),
  ]);
  // Fallback: when nothing is flagged featured, show the first published
  // projects so the section never renders empty on a live page.
  const projects = (featured.length > 0 ? featured : await getProjects()).slice(
    0,
    limit,
  );
  if (projects.length === 0) return null;

  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));

  const slides = projects.map((project, i) => {
    const categorySlug = categorySlugById.get(project.categoryId);
    const href = categorySlug
      ? `/portfolio/${categorySlug}/${project.slug}`
      : "/portfolio";
    return (
      <article
        key={project.id}
        className="relative h-full min-h-[70vh] w-full overflow-hidden bg-ink-soft"
      >
        <Image
          src={project.coverImage}
          alt={project.coverImageAlt}
          fill
          sizes="100vw"
          quality={80}
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/25"
        />

        {/* Oversized index number, parallaxing at a slide-specific rate */}
        <Parallax
          speed={i % 2 === 0 ? 0.88 : 0.94}
          className="absolute right-[4%] top-[6%] z-[1]"
        >
          <span
            aria-hidden="true"
            className="select-none font-display text-[clamp(6rem,16vw,15rem)] font-semibold leading-none tracking-tight text-white/10 tabular-nums"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
        </Parallax>

        <div className="absolute inset-x-0 bottom-0 z-[2] p-[clamp(1.5rem,5vw,4rem)]">
          <p className="kicker kicker--accent mb-4">
            {project.location} · {project.year}
          </p>
          <h3 className="max-w-3xl text-display-2 text-white">
            {project.name}
          </h3>
          <span
            aria-hidden="true"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-gold-bright"
          >
            View case study
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>

        {/* Single full-slide link = one tab stop per project */}
        <Link
          href={href}
          data-cursor="view"
          data-cursor-label="View"
          className="absolute inset-0 z-[3]"
        >
          <span className="sr-only">{project.name} — view case study</span>
        </Link>
      </article>
    );
  });

  return (
    <section className="section-dark on-dark" data-nav-theme="dark">
      <PinnedScene
        heading={
          p.kicker || p.heading ? (
            <div className="container-site pb-12 pt-[var(--section-pad)]">
              <SectionHeader kicker={p.kicker} heading={p.heading} dark />
            </div>
          ) : undefined
        }
      >
        {slides}
      </PinnedScene>
    </section>
  );
}
