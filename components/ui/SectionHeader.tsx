import type { CSSProperties } from "react";
import type { ThemeColor } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Reveal, SplitTextReveal } from "@/components/motion";

/**
 * Kicker + display-2 SplitTextReveal heading + optional supporting text
 * (CONTRACTS.md — ui/SectionHeader). Used at the top of most blocks.
 * Null-safe: renders nothing when kicker, heading and text are all empty.
 */

export interface SectionHeaderProps {
  kicker?: string;
  heading?: string;
  text?: string;
  dark?: boolean;
  align?: "left" | "center";
  theme?: ThemeColor;
  /** optional extra classes on the wrapper (additive to defaults) */
  className?: string;
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

export function SectionHeader({
  kicker,
  heading,
  text,
  dark = false,
  align = "left",
  theme,
  className,
}: SectionHeaderProps) {
  if (!kicker && !heading && !text) return null;

  return (
    <div
      className={cn(
        "mb-12 max-w-3xl md:mb-16",
        align === "center" && "mx-auto text-center",
        dark && "on-dark",
        className,
      )}
      style={theme ? themeVars(theme) : undefined}
    >
      {kicker ? (
        <Reveal variant="fade" as="p" className="mb-5">
          <span className={cn("kicker", theme && "kicker--accent")}>
            {kicker}
          </span>
        </Reveal>
      ) : null}
      {heading ? (
        <SplitTextReveal text={heading} as="h2" className="text-display-2" />
      ) : null}
      {text ? (
        <Reveal
          variant="fade"
          as="p"
          delay={0.15}
          className={cn(
            "mt-5 max-w-[58ch] text-base md:text-lg",
            dark ? "text-plaster/70" : "text-ink/70",
            align === "center" && "mx-auto",
          )}
        >
          {text}
        </Reveal>
      ) : null}
    </div>
  );
}

export default SectionHeader;
