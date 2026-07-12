import type { CSSProperties } from "react";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { ThemeColor } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { KenBurns, Reveal, SplitTextReveal } from "@/components/motion";

/**
 * Inner-page hero: kicker + display-2 split-text heading + optional
 * subheading. With a background photo set (Sobha-style) it becomes a
 * full-bleed image hero — slow Ken Burns, ink scrim, white type — and grows
 * to ~60svh. The theme prop tints the section accent via inline CSS custom
 * properties; dark renders on ink.
 */

type PageHeroProps = {
  kicker: string;
  heading: string;
  subheading: string;
  theme: ThemeColor;
  dark: boolean;
  image?: { src: string; alt: string };
};

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

export default async function PageHero({ props }: BlockComponentProps) {
  const p = props as unknown as PageHeroProps;
  if (!p.kicker && !p.heading && !p.subheading) return null;

  const hasImage = Boolean(p.image?.src);
  const onDark = hasImage || p.dark;

  return (
    <section
      data-nav-theme={onDark ? "dark" : undefined}
      className={cn(
        "relative flex items-end overflow-hidden",
        hasImage ? "min-h-[60svh] bg-ink text-plaster" : "min-h-[40svh]",
        !hasImage && p.dark && "section-dark",
        onDark && "on-dark",
      )}
      style={themeVars(p.theme ?? "gold")}
    >
      {hasImage ? (
        <>
          <div className="absolute inset-0">
            <KenBurns
              src={p.image!.src}
              alt={p.image!.alt ?? ""}
              className="h-full w-full"
              priority
              sizes="100vw"
            />
          </div>
          {/* Ink scrim — bottom-heavy so the type stays AA-readable */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgb(10 10 13 / 0.85) 0%, rgb(10 10 13 / 0.45) 45%, rgb(10 10 13 / 0.25) 100%)",
            }}
          />
        </>
      ) : null}

      <div className="container-site relative w-full pt-[calc(var(--nav-h)+3.5rem)] pb-14 md:pb-20">
        {p.kicker ? (
          <Reveal variant="fade" as="p" className="mb-5">
            <span className="kicker kicker--accent">{p.kicker}</span>
          </Reveal>
        ) : null}
        {p.heading ? (
          <SplitTextReveal
            text={p.heading}
            as="h1"
            className="text-display-2 max-w-4xl"
          />
        ) : null}
        {p.subheading ? (
          <Reveal
            variant="fade"
            as="p"
            delay={0.15}
            className={cn(
              "mt-5 max-w-[58ch] text-base md:text-lg",
              onDark ? "text-plaster/75" : "text-ink/70",
            )}
          >
            {p.subheading}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
