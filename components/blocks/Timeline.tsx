import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { LinkProps } from "@/lib/blocks/defs";
import { STAGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { DrawLine, Reveal } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import TimelineDrawClient from "./client/TimelineDrawClient";

/**
 * Milestone timeline (ARCHITECTURE.md §5.1.6 + §5.6.1).
 * compact: horizontal strip of milestone years, a gold line draws across,
 * optional link (home teaser). full: vertical scroll-driven timeline — the
 * gold line draws down scrubbed to scroll while milestone cards alternate
 * sides, years set in display type.
 */

type Milestone = { year: string; title: string; text: string };

type TimelineProps = {
  kicker: string;
  heading: string;
  milestones: Milestone[];
  compact: boolean;
  link?: LinkProps;
};

function ArrowIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function TimelineLink({ link, className }: { link?: LinkProps; className?: string }) {
  if (!link?.label || !link?.href) return null;
  return (
    <Reveal variant="fade" delay={0.2} className={className}>
      <Link
        href={link.href}
        className="link-underline inline-flex items-center gap-2 font-medium text-gold-deep"
      >
        {link.label}
        <ArrowIcon className="size-4 shrink-0" />
      </Link>
    </Reveal>
  );
}

export default async function Timeline({ props }: BlockComponentProps) {
  const p = props as unknown as TimelineProps;
  const milestones = (p.milestones ?? []).filter((m) => m && m.year);
  if (milestones.length === 0) return null;

  if (p.compact) {
    return (
      <section className="section-pad">
        <div className="container-site">
          <SectionHeader kicker={p.kicker} heading={p.heading} />
          <div className="relative">
            {/* Gold line drawing across the strip */}
            <div
              className="absolute inset-x-0 top-[5px] text-gold/60"
              aria-hidden="true"
            >
              <DrawLine orientation="h" className="w-full" />
            </div>
            <ol className="flex flex-wrap gap-x-12 gap-y-10 sm:justify-between">
              {milestones.map((milestone, i) => (
                <li key={i} className="relative pt-9">
                  <span
                    className="absolute top-0 left-0 block size-[11px] rounded-full bg-gold"
                    aria-hidden="true"
                  />
                  <Reveal variant="fade" delay={i * STAGGER.cards}>
                    <span className="font-display block text-3xl font-semibold tracking-tight md:text-4xl">
                      {milestone.year}
                    </span>
                    {milestone.title ? (
                      <span className="mt-1 block max-w-[24ch] text-sm text-stone">
                        {milestone.title}
                      </span>
                    ) : null}
                  </Reveal>
                </li>
              ))}
            </ol>
            <TimelineLink link={p.link} className="mt-12" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />
        <div className="relative">
          {/* Vertical gold line — draws down with scroll (client scrub) */}
          <TimelineDrawClient className="absolute top-1 bottom-0 left-[5px] w-px bg-gold/70 md:left-[calc(50%-0.5px)]" />
          <ol className="flex flex-col gap-16 md:gap-24">
            {milestones.map((milestone, i) => {
              const left = i % 2 === 0;
              return (
                <li
                  key={i}
                  className="relative pl-10 md:grid md:grid-cols-2 md:gap-20 md:pl-0"
                >
                  <span
                    className="absolute top-2 left-[5px] size-[11px] -translate-x-1/2 rounded-full border-2 border-gold bg-plaster md:left-1/2"
                    aria-hidden="true"
                  />
                  <Reveal
                    className={cn(
                      left
                        ? "md:col-start-1 md:pr-4 md:text-right"
                        : "md:col-start-2 md:pl-4",
                    )}
                  >
                    <span className="text-display-2 block leading-none text-gold-deep">
                      {milestone.year}
                    </span>
                    {milestone.title ? (
                      <h3 className="font-display mt-4 text-xl md:text-2xl">
                        {milestone.title}
                      </h3>
                    ) : null}
                    {milestone.text ? (
                      <p
                        className={cn(
                          "mt-3 max-w-[46ch] text-ink/70",
                          left && "md:ml-auto",
                        )}
                      >
                        {milestone.text}
                      </p>
                    ) : null}
                  </Reveal>
                </li>
              );
            })}
          </ol>
          <TimelineLink link={p.link} className="mt-16 md:text-center" />
        </div>
      </div>
    </section>
  );
}
