import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { ThemeColor } from "@/lib/content/types";
import { getCategories } from "@/lib/content";
import { STAGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { Reveal, TiltCard } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";

/**
 * "What we do" sector cards (ARCHITECTURE.md §5.1.4): themed TiltCards
 * (cypress/aegean/gold) — image top, title, one-liner, arrow. Auto-fills from
 * portfolio categories (title=name, text=first sentence of intro, link to
 * /portfolio/slug) or uses custom cards. Whole card is a link with
 * data-cursor="view"; cards rise in with a stagger.
 */

type SectorCard = {
  title: string;
  text: string;
  image: { src: string; alt: string };
  href: string;
  theme: ThemeColor;
};

type SectorCardsProps = {
  kicker: string;
  heading: string;
  useCategories: boolean;
  cards: SectorCard[];
};

function firstSentence(text: string): string {
  const trimmed = (text ?? "").trim();
  const match = trimmed.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : trimmed).trim();
}

/** Local accent override per CONTRACTS.md ("each block implements locally"). */
function themeVars(theme: ThemeColor): CSSProperties {
  if (theme === "gold") {
    return {
      "--accent": "var(--gold)",
      "--accent-bright": "var(--gold-bright)",
      "--accent-deep": "var(--gold-deep)",
    } as CSSProperties;
  }
  const base = theme === "cypress" ? "var(--cypress)" : "var(--aegean)";
  return {
    "--accent": base,
    "--accent-bright": `color-mix(in srgb, ${base} 65%, white)`,
    "--accent-deep": `color-mix(in srgb, ${base} 85%, black)`,
  } as CSSProperties;
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export default async function SectorCards({ props }: BlockComponentProps) {
  const p = props as unknown as SectorCardsProps;

  let cards: SectorCard[] = [];
  if (p.useCategories) {
    const categories = await getCategories();
    cards = categories.map((category) => ({
      title: category.name,
      text: firstSentence(category.intro),
      image: {
        src: category.coverImage,
        alt: category.coverImageAlt || category.name,
      },
      href: `/portfolio/${category.slug}`,
      theme: category.themeColor,
    }));
  }
  if (cards.length === 0) cards = p.cards ?? [];
  cards = cards.filter((c) => c && c.title);
  if (cards.length === 0) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />
        <div className="grid gap-6 md:grid-cols-3 md:gap-7">
          {cards.map((card, i) => (
            <Reveal key={i} delay={i * STAGGER.cards} className="h-full">
              <Link
                href={card.href || "/portfolio"}
                data-cursor="view"
                data-cursor-label="View"
                className="group block h-full"
                style={themeVars(card.theme ?? "gold")}
              >
                <TiltCard
                  theme={card.theme ?? "gold"}
                  imageScaleOnHover
                  className="rounded-card h-full overflow-hidden bg-white shadow-[0_10px_50px_-20px_rgba(14,18,22,0.18)]"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    {card.image?.src ? (
                      <Image
                        src={card.image.src}
                        alt={card.image.alt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-ink/5" />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-4 p-6 md:p-7">
                    <div>
                      <h3 className="font-display text-xl md:text-2xl">
                        {card.title}
                      </h3>
                      {card.text ? (
                        <p className="mt-2 text-[15px] leading-relaxed text-ink/60">
                          {card.text}
                        </p>
                      ) : null}
                    </div>
                    <ArrowUpRightIcon className="text-accent-deep mt-1.5 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </TiltCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
