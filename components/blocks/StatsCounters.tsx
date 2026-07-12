import type { BlockComponentProps } from "@/components/blocks/registry";
import type { StatItem } from "@/lib/content/types";
import { getSettings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Counter, DrawLine } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";

/**
 * Experience/stats band (ARCHITECTURE.md §5.1.2): dark ink band by default,
 * gold counting numbers, stone labels, thin gold divider lines that draw
 * themselves in. Uses site-settings stats or the block's own list.
 */

type StatsCountersProps = {
  kicker: string;
  heading: string;
  useSiteStats: boolean;
  items: { label: string; value: number; suffix: string }[];
  dark: boolean;
};

export default async function StatsCounters({ props }: BlockComponentProps) {
  const p = props as unknown as StatsCountersProps;

  let stats: StatItem[] = p.useSiteStats
    ? (await getSettings()).stats
    : (p.items ?? []);
  stats = (stats ?? []).filter(
    (s) => s && s.label && Number.isFinite(s.value),
  );
  if (stats.length === 0) return null;

  const dark = p.dark !== false;
  const cols =
    stats.length >= 4
      ? "md:grid-cols-4"
      : stats.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2";

  return (
    <section
      data-nav-theme={dark ? "dark" : undefined}
      className={cn("section-pad", dark && "section-dark on-dark")}
    >
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} dark={dark} />
        <ul className={cn("grid grid-cols-2 gap-x-10 gap-y-14", cols)}>
          {stats.map((stat, i) => (
            <li key={i} className="flex flex-col">
              <div
                className={cn("mb-6", dark ? "text-gold/70" : "text-gold/60")}
                aria-hidden="true"
              >
                <DrawLine orientation="h" delay={i * 0.08} className="w-full" />
              </div>
              <Counter
                value={stat.value}
                suffix={stat.suffix}
                className={cn(
                  "text-display-2 tabular-nums",
                  dark ? "text-gold" : "text-gold-deep",
                )}
              />
              <span className="mt-3 block text-[11px] font-semibold tracking-[0.18em] text-stone uppercase md:text-xs">
                {stat.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
