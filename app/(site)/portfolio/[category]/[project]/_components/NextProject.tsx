import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content/types";
import { Reveal } from "@/components/motion";

/**
 * Next-project footer (ARCHITECTURE §5.4): full-width teaser of the next
 * project in the category. The image scales in as the block enters
 * (Reveal "scale"); the whole block is one link that keeps visitors
 * flowing through the portfolio.
 */
export default function NextProject({
  project,
  categorySlug,
}: {
  project: Project;
  categorySlug: string;
}) {
  return (
    <Link
      href={`/portfolio/${categorySlug}/${project.slug}`}
      data-cursor="view"
      data-cursor-label="View"
      className="group relative block overflow-hidden bg-ink text-plaster on-dark"
      data-nav-theme="dark"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <Reveal variant="scale" className="h-full w-full">
          <div className="relative h-full w-full">
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-40 transition-transform [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.05]"
              />
            ) : (
              <div className="h-full w-full bg-ink-soft" />
            )}
          </div>
        </Reveal>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" />
      </div>

      <div className="container-site relative flex min-h-[52vh] flex-col justify-center py-24">
        <p className="kicker kicker--accent">Next project</p>
        <h2 className="text-display-2 mt-6 max-w-4xl text-plaster">
          {project.name}
        </h2>
        <div className="mt-6 flex items-center gap-4 text-sm text-plaster/70">
          {project.location ? <span>{project.location}</span> : null}
          {project.location && project.year ? (
            <span aria-hidden="true">·</span>
          ) : null}
          {project.year ? <span>{project.year}</span> : null}
        </div>
        <span className="link-underline mt-10 inline-flex w-fit items-center gap-3 font-medium text-gold-bright">
          View case study
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
