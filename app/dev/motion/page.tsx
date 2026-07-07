import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteProviders } from "@/components/providers";
import {
  Counter,
  DrawLine,
  KenBurns,
  MagneticButton,
  MorphButton,
  Parallax,
  PinnedScene,
  Reveal,
  SplitTextReveal,
  TiltCard,
} from "@/components/motion";
import { cn } from "@/lib/utils";
import { MorphButtonDemo, MotionSwitch } from "./demos";

export const metadata: Metadata = {
  title: "Motion Playground",
  robots: { index: false, follow: false },
};

/** Section header used across the playground (kicker + SplitTextReveal). */
function Header({
  kicker,
  title,
  dark = false,
}: {
  kicker: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className={cn("kicker kicker--accent", dark && "text-gold-bright")}>
        {kicker}
      </p>
      <SplitTextReveal as="h2" text={title} className="text-display-2 mt-5" />
    </div>
  );
}

const PROCESS = [
  {
    index: "01",
    title: "Consult",
    body: "Feasibility, tender strategy and budget framing before a single drawing is committed. We price honestly and plan for approvals from day one.",
  },
  {
    index: "02",
    title: "Engineer",
    body: "Structural design, seismic compliance and value engineering handled in-house, coordinated with the island's certifying authorities.",
  },
  {
    index: "03",
    title: "Build",
    body: "Our own crews and plant on site. Weekly progress reporting, independent QA inspections and a safety record we publish, not bury.",
  },
  {
    index: "04",
    title: "Deliver",
    body: "Snag-free handover with as-built documentation, warranties and a two-year defects response commitment on every contract.",
  },
];

export default function MotionPlaygroundPage() {
  return (
    <SiteProviders>
      <main id="main">
        {/* ── 1 · Hero — SplitTextReveal, MorphButton, custom cursor host ── */}
        <section
          className="section-dark on-dark gold-mesh"
          data-nav-theme="dark"
        >
          <div className="container-site section-pad flex min-h-[92vh] flex-col justify-between gap-16">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone">
                Characom · dev/motion
              </p>
              <MotionSwitch dark />
            </div>
            <div>
              <p className="kicker kicker--accent">Motion core playground</p>
              <SplitTextReveal
                as="h1"
                text="Movement, engineered like a structure."
                className="text-display-1 mt-6 max-w-5xl"
              />
              <Reveal variant="rise" delay={0.35} className="mt-8 max-w-xl">
                <p className="text-plaster/70">
                  Every primitive on this page ships from{" "}
                  <code className="font-display text-gold-bright">
                    components/motion
                  </code>
                  . Flip the reduced-motion switch to verify each one degrades
                  to its final state.
                </p>
              </Reveal>
              <Reveal
                variant="fade"
                delay={0.55}
                className="mt-10 flex flex-wrap gap-4"
              >
                <MorphButton label="Explore primitives" href="#reveal" dark />
                <MorphButton
                  label="Back to site"
                  href="/"
                  variant="ghost"
                  dark
                />
              </Reveal>
            </div>
            <DrawLine className="text-plaster/25" />
          </div>
        </section>

        {/* ── 2 · Reveal variants ─────────────────────────────────────────── */}
        <section id="reveal" className="bg-plaster">
          <div className="container-site section-pad">
            <Header
              kicker="Reveal"
              title="Four variants, one trigger point."
            />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["fade", "Opacity only. The quiet default for body copy and secondary media."],
                  ["rise", "Fades while rising 32px. The workhorse for cards and paragraphs."],
                  ["clip", "Unmasks top-to-bottom with a short rise. For images and panels."],
                  ["scale", "Settles from 95% scale. For stats, badges and framed media."],
                ] as const
              ).map(([variant, copy], i) => (
                <Reveal
                  key={variant}
                  variant={variant}
                  delay={i * 0.08}
                  className="flex min-h-56 flex-col justify-between rounded-card border border-ink/10 bg-white p-7"
                >
                  <span className="kicker kicker--accent">{variant}</span>
                  <p className="text-sm leading-relaxed text-ink/70">{copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3 · Counter ─────────────────────────────────────────────────── */}
        <section className="section-dark on-dark" data-nav-theme="dark">
          <div className="container-site section-pad">
            <Header
              dark
              kicker="Counter"
              title="Numbers that earn their keep."
            />
            <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  [214, "+", "Projects delivered"],
                  [38, undefined, "Years building in Cyprus"],
                  [96, "%", "Repeat & referred clients"],
                  [1.2, "M", "Square metres completed"],
                ] as const
              ).map(([value, suffix, label]) => (
                <div key={label}>
                  <Counter
                    value={value}
                    suffix={suffix}
                    className="text-display-2 font-display text-plaster"
                  />
                  <p className="mt-3 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-stone">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4 · Parallax + KenBurns ─────────────────────────────────────── */}
        <section className="bg-plaster">
          <div className="container-site section-pad">
            <Header
              kicker="Parallax · KenBurns"
              title="Depth without a single layout shift."
            />
            <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
              <KenBurns
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1920&auto=format&fit=crop"
                alt="Tower crane over a concrete frame at sunrise on a Cyprus construction site"
                className="aspect-[4/5] rounded-card"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div>
                <Parallax speed={0.85}>
                  <div className="rounded-card border border-ink/10 bg-white p-10">
                    <p className="kicker kicker--accent">Slower than the page</p>
                    <h3 className="mt-4 font-display text-2xl font-semibold">
                      speed = 0.85
                    </h3>
                    <p className="mt-4 text-ink/70">
                      This card drifts against the scroll while the Ken Burns
                      frame beside it breathes between scale 1 and 1.06 —
                      pausing the moment it leaves the viewport.
                    </p>
                    <DrawLine className="mt-8 text-ink/20" />
                  </div>
                </Parallax>
                <Parallax speed={1.12} className="mt-8 flex justify-end">
                  <span className="rounded-pill border border-ink/20 px-5 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-stone">
                    speed = 1.12 · faster
                  </span>
                </Parallax>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5 · TiltCard + custom cursor targets ────────────────────────── */}
        <section className="section-dark on-dark" data-nav-theme="dark">
          <div className="container-site section-pad">
            <Header
              dark
              kicker="TiltCard · Cursor"
              title="Cards that lean into the light."
            />
            <p className="mt-6 max-w-xl text-plaster/60">
              On desktop, the custom cursor ring expands with a label over each
              card. Tilt is capped at 6° with a theme-colored glow tracking the
              pointer.
            </p>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {(
                [
                  [
                    "gold",
                    "Government & public works",
                    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1920&auto=format&fit=crop",
                    "White concrete civic building facade against a clear sky",
                  ],
                  [
                    "aegean",
                    "Real estate development",
                    "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=1920&auto=format&fit=crop",
                    "Low angle of a glass office tower reflecting the evening sky",
                  ],
                  [
                    "cypress",
                    "Residential construction",
                    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1920&auto=format&fit=crop",
                    "Architectural drawings and a scale model on a work table",
                  ],
                ] as const
              ).map(([theme, title, src, alt]) => (
                <div key={theme} data-cursor="view" data-cursor-label="View">
                  <TiltCard
                    theme={theme}
                    className="glow-accent overflow-hidden rounded-card border border-white/10 bg-ink-soft"
                  >
                    <figure className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </figure>
                    <div className="p-7">
                      <span className="kicker kicker--accent">{theme}</span>
                      <h3 className="mt-3 font-display text-xl font-semibold text-plaster">
                        {title}
                      </h3>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6 · MorphButton — variants + states ─────────────────────────── */}
        <section className="bg-plaster">
          <div className="container-site section-pad">
            <Header
              kicker="MorphButton"
              title="One CTA, every state accounted for."
            />
            <div className="mt-14 grid gap-10 lg:grid-cols-2">
              <div className="rounded-card border border-ink/10 bg-white p-10">
                <p className="kicker kicker--accent">On light</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <MorphButton label="Start a project" href="/contact" />
                  <MorphButton
                    label="Our portfolio"
                    href="/portfolio"
                    variant="ghost"
                  />
                </div>
                <div className="mt-10">
                  <MorphButtonDemo />
                </div>
              </div>
              <div className="section-dark on-dark rounded-card p-10">
                <p className="kicker kicker--accent">On dark</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <MorphButton label="Start a project" href="/contact" dark />
                  <MorphButton
                    label="Our portfolio"
                    href="/portfolio"
                    variant="ghost"
                    dark
                  />
                </div>
                <p className="mt-10 max-w-sm text-sm text-plaster/60">
                  Hover: gold wipe from the left, radius morphs pill to square,
                  ±8px magnetic pull. Press: scale 0.97 with spring overshoot.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7 · MagneticButton + DrawLine ───────────────────────────────── */}
        <section className="section-dark on-dark" data-nav-theme="dark">
          <div className="container-site section-pad">
            <Header
              dark
              kicker="MagneticButton · DrawLine"
              title="Small pulls, drawn rules."
            />
            <div className="mt-14 flex flex-wrap items-center gap-8">
              {(
                [
                  ["Back to top", "M12 19V5M5.5 11.5L12 5l6.5 6.5"],
                  ["Next project", "M5 12h14m-6.5-6.5L19 12l-6.5 6.5"],
                  ["Open menu", "M4 7h16M4 12h16M4 17h16"],
                ] as const
              ).map(([label, d]) => (
                <MagneticButton key={label}>
                  <button
                    type="button"
                    aria-label={label}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 text-plaster transition-colors duration-300 hover:border-gold-bright hover:text-gold-bright"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d={d} />
                    </svg>
                  </button>
                </MagneticButton>
              ))}
              <div className="flex h-16 items-center gap-6">
                <DrawLine orientation="v" className="text-plaster/25" />
                <p className="max-w-xs text-sm text-plaster/60">
                  ±8px spring pull, desktop fine-pointer only. The vertical and
                  horizontal rules draw themselves at 75% viewport.
                </p>
              </div>
            </div>
            <DrawLine delay={0.2} className="mt-16 text-plaster/25" />
          </div>
        </section>

        {/* ── 8 · PinnedScene ─────────────────────────────────────────────── */}
        <PinnedScene
          className="bg-plaster"
          heading={
            <Header
              kicker="PinnedScene"
              title="The build sequence, pinned and scrubbed."
            />
          }
        >
          {PROCESS.map((step) => (
            <article
              key={step.index}
              className="flex min-h-[46vh] flex-col justify-between rounded-card border border-ink/10 bg-white p-10 lg:min-h-[52vh]"
            >
              <span
                aria-hidden="true"
                className="font-display text-[clamp(3.5rem,6vw,6rem)] font-semibold leading-none text-gold/30"
              >
                {step.index}
              </span>
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-md text-ink/70">{step.body}</p>
              </div>
            </article>
          ))}
        </PinnedScene>

        {/* ── 9 · Footer note ─────────────────────────────────────────────── */}
        <footer className="section-dark on-dark" data-nav-theme="dark">
          <div className="container-site flex flex-wrap items-center justify-between gap-6 py-12">
            <p className="text-sm text-plaster/60">
              Internal motion playground — not linked from the public site and
              excluded from indexing.
            </p>
            <Link
              href="/"
              className="link-underline text-sm font-semibold text-gold-bright"
            >
              characom.com.cy
            </Link>
          </div>
        </footer>
      </main>
    </SiteProviders>
  );
}
