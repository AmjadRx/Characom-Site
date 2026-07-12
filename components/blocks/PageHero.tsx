import type { CSSProperties } from "react";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { ThemeColor } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Reveal, SplitTextReveal } from "@/components/motion";

/**
 * Short inner-page hero (~40vh): kicker + display-2 split-text heading +
 * optional subheading. The theme prop tints the section accent via inline
 * CSS custom properties; dark renders on ink.
 */

type PageHeroProps = {
  kicker: string;
  heading: string;
  subheading: string;
  theme: ThemeColor;
  dark: boolean;
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

  return (
    <section
      data-nav-theme={p.dark ? "dark" : undefined}
      className={cn(
        "relative flex min-h-[40svh] items-end",
        p.dark && "section-dark on-dark",
      )}
      style={themeVars(p.theme ?? "gold")}
    >
      <div className="container-site w-full pt-[calc(var(--nav-h)+3.5rem)] pb-14 md:pb-20">
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
              p.dark ? "text-plaster/70" : "text-ink/70",
            )}
          >
            {p.subheading}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
