import Link from "next/link";
import type React from "react";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { ThemeColor } from "@/lib/content/types";
import { getCategories, getProjects } from "@/lib/content";
import { Counter, KenBurns, Reveal } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import { STAGGER } from "@/lib/motion/constants";

interface CategoryPanelsProps {
  kicker?: string;
  heading?: string;
}

/** Local theme override helper (CONTRACTS.md — each block implements). */
const ACCENTS: Record<ThemeColor, { accent: string; bright: string; deep: string }> = {
  gold: {
    accent: "var(--gold)",
    bright: "var(--gold-bright)",
    deep: "var(--gold-deep)",
  },
  cypress: {
    accent: "var(--cypress)",
    bright: "color-mix(in srgb, var(--cypress) 65%, white)",
    deep: "color-mix(in srgb, var(--cypress) 80%, black)",
  },
  aegean: {
    accent: "var(--aegean)",
    bright: "color-mix(in srgb, var(--aegean) 65%, white)",
    deep: "color-mix(in srgb, var(--aegean) 80%, black)",
  },
};

function themeVars(theme: ThemeColor): React.CSSProperties {
  const a = ACCENTS[theme];
  return {
    "--accent": a.accent,
    "--accent-bright": a.bright,
    "--accent-deep": a.deep,
  } as React.CSSProperties;
}

/**
 * §5.2 Category panels — one full-width Ken Burns panel per portfolio
 * category. Theme scrim intensifies on hover, staggered clip-path reveals,
 * and hovering one panel dims its siblings (pure CSS — no client wrapper).
 */
export default async function CategoryPanels({ props }: BlockComponentProps) {
  const p = props as unknown as CategoryPanelsProps;
  const categories = await getCategories();
  if (categories.length === 0) return null;

  const projectLists = await Promise.all(
    categories.map((c) => getProjects({ categorySlug: c.slug })),
  );

  return (
    <section className="pb-[var(--section-pad)]">
      {(p.kicker || p.heading) && (
        <div className="container-site pt-[var(--section-pad)]">
          <SectionHeader kicker={p.kicker} heading={p.heading} />
        </div>
      )}

      {/* Hovering a panel dims its siblings (descendant :hover technique). */}
      <div className="flex flex-col [&:hover_.cat-panel:not(:hover)]:opacity-50">
        {categories.map((category, i) => {
          const count = projectLists[i]?.length ?? 0;
          return (
            <Reveal
              key={category.id}
              variant="clip"
              delay={Math.min(i, 2) * STAGGER.cards}
            >
              <Link
                href={`/portfolio/${category.slug}`}
                data-cursor="view"
                data-cursor-label="Explore"
                className="cat-panel on-dark group relative block h-[55vh] min-h-[400px] overflow-hidden transition-opacity duration-500"
                style={themeVars(category.themeColor)}
              >
                <KenBurns
                  src={category.coverImage}
                  alt={category.coverImageAlt}
                  className="absolute inset-0 h-full w-full"
                  sizes="100vw"
                />
                {/* base ink scrim for text legibility */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/15"
                />
                {/* theme scrim — intensifies on hover/focus */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-30 transition-opacity duration-700 group-hover:opacity-65 group-focus-visible:opacity-65"
                  style={{
                    background:
                      "linear-gradient(to top, color-mix(in srgb, var(--accent) 60%, transparent), transparent 72%)",
                  }}
                />

                <div className="container-site relative flex h-full flex-col justify-end gap-6 pb-[clamp(2rem,5vw,3.5rem)] md:flex-row md:items-end md:justify-between">
                  <div className="max-w-3xl">
                    <h3 className="text-display-1 text-white">
                      {category.name}
                    </h3>
                    {category.intro ? (
                      <p className="mt-3 max-w-xl text-sm leading-relaxed text-plaster/75 md:text-base">
                        {category.intro}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-end gap-10">
                    <p className="leading-none">
                      <Counter
                        value={count}
                        className="font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none text-[color:var(--accent-bright)]"
                      />
                      <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.16em] text-plaster/70">
                        {count === 1 ? "Project" : "Projects"}
                      </span>
                    </p>
                    <span
                      aria-hidden="true"
                      className="mb-1 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-transform duration-500 group-hover:translate-x-1.5"
                    >
                      Explore
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
                </div>
                <span className="sr-only">
                  Explore {category.name} projects
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
