"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { loaderImageSrc, pickLoaderImage } from "@/lib/loader-images";
import { useReducedMotionPref } from "@/components/providers";

/** counting portion of the sequence — exit wipe keeps total < DUR.preloaderMax */
const COUNT_MS = 1300;
const HOLD_MS = 250;

const EASE_IN_OUT: [number, number, number, number] = [...EASE_FM.inOut];

type Phase = "playing" | "exiting" | "done";

/**
 * Play once per FULL page load. The site shell lives inside the
 * route-transition's keyed subtree, so this component remounts on every
 * client-side navigation — module state survives those remounts (route
 * changes get the transition-panel counter instead) and resets only on a
 * real browser load.
 */
let playedThisPageLoad = false;

export interface PreloaderProps {
  /** small wordmark shown top-left; defaults to the brand name */
  logoText?: string;
  /** construction photography shown full-bleed behind the counter */
  images?: string[];
}

/**
 * Load screen (owner directives 2026-07-12): the FIRST paint of every full
 * page load is this overlay — it is server-rendered in its visible state so
 * the page never flashes underneath (the earlier bug). A large construction
 * photo (Sobha-style full-bleed with scrim) sits behind a giant counting
 * percentage; on 100% the screen wipes up to reveal the page.
 * - photo chosen deterministically from settings.loaderImages (same pick on
 *   server + client — no hydration mismatch); placeholders until the owner
 *   uploads real photography via Admin → Settings
 * - rAF-driven count (no re-render per frame), capped at DUR.preloaderMax
 * - hidden for no-JS visitors (noscript) and skipped under reduced motion
 * - aria-hidden, zero focusables — never traps focus
 */
export default function Preloader({
  logoText = "CHARACOM",
  images = [],
}: PreloaderProps) {
  const { reduced } = useReducedMotionPref();
  const pathname = usePathname();
  // Server-render in the visible "playing" state — instant first paint.
  // Client remounts after a navigation skip straight to "done".
  const [phase, setPhase] = useState<Phase>(() =>
    playedThisPageLoad ? "done" : "playing",
  );
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    playedThisPageLoad = true;
  }, []);

  const photo = loaderImageSrc(pickLoaderImage(images, pathname ?? "/"));

  /* Reduced motion (system or persisted toggle): end immediately. */
  useEffect(() => {
    if (phase !== "playing") return;
    const prefersReduced =
      reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-reduced-motion") === "true";
    if (prefersReduced) setPhase("done");
  }, [reduced, phase]);

  /* Count 0 → 100 via rAF, hold briefly, exit. Hard cap at DUR.preloaderMax. */
  useEffect(() => {
    if (phase !== "playing") return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    let raf = 0;
    let holdTimer = 0;
    const startAt = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startAt) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * 100);
      if (counterRef.current) counterRef.current.textContent = String(value);
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        holdTimer = window.setTimeout(() => setPhase("exiting"), HOLD_MS);
      }
    };

    raf = requestAnimationFrame(tick);
    const cap = window.setTimeout(
      () => setPhase("exiting"),
      DUR.preloaderMax * 1000,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.clearTimeout(cap);
      html.style.overflow = prevOverflow;
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <>
      <noscript>
        <style>{`[data-load-screen]{display:none!important}`}</style>
      </noscript>
      <AnimatePresence onExitComplete={() => setPhase("done")}>
        {phase === "playing" && (
          <motion.div
            data-load-screen
            aria-hidden="true"
            role="presentation"
            className="fixed inset-0 z-[100] select-none overflow-hidden bg-ink text-plaster"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              y: "-100%",
              transition: { duration: DUR.base, ease: EASE_IN_OUT },
            }}
          >
            {/* Full-bleed construction photo, slow settle 1.07 → 1 */}
            <motion.img
              src={photo}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...({ fetchpriority: "high" } as any)}
              initial={{ scale: 1.07 }}
              animate={{
                scale: 1,
                transition: { duration: 2.2, ease: [...EASE_FM.out] },
              }}
            />
            {/* Ink scrim — bottom-heavy for the counter, Sobha-style */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgb(10 10 13 / 0.92) 0%, rgb(10 10 13 / 0.55) 40%, rgb(10 10 13 / 0.35) 100%)",
              }}
            />

            {/* Small wordmark, top-left */}
            <div className="absolute left-[var(--gutter)] top-8 flex items-baseline gap-3">
              <span className="font-display text-2xl font-medium tracking-[0.02em]">
                {logoText}
                <span className="text-gold-bright">.</span>
              </span>
              <span className="hidden text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/50 sm:inline">
                Building Cyprus
              </span>
            </div>

            {/* THE number — giant serif percentage, bottom-left */}
            <div className="absolute bottom-[4vh] left-[var(--gutter)] font-display font-medium leading-none">
              <span
                ref={counterRef}
                className="text-[clamp(7rem,24vw,19rem)] tracking-[-0.02em] text-plaster"
              >
                0
              </span>
              <span className="ml-2 align-top text-[clamp(1.75rem,4vw,3rem)] text-gold-bright">
                %
              </span>
            </div>

            {/* Hairline progress along the very bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/15">
              <div
                ref={barRef}
                className="h-full w-full origin-left scale-x-0 bg-gold"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
