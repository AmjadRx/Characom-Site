"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

/** counting portion of the sequence — exit wipe keeps total < DUR.preloaderMax */
const COUNT_MS = 1300;
const HOLD_MS = 250;

const EASE_IN_OUT: [number, number, number, number] = [...EASE_FM.inOut];

type Phase = "pending" | "playing" | "exiting" | "done";

export interface PreloaderProps {
  /** small wordmark shown top-left; defaults to the brand name */
  logoText?: string;
}

/**
 * Load counter (owner directive, 2026-07-12): on EVERY full page load the
 * first thing a visitor sees is a giant percentage counting up — the luxury
 * portfolio pattern (cf. DAMAC/Emaar-tier property sites). Client-side route
 * changes get the same treatment from PageTransitionProvider.
 * - giant serif number bottom-left, rAF-driven (no re-render per frame)
 * - hairline gold progress along the very bottom edge of the viewport
 * - hard-capped at DUR.preloaderMax, then wipes up and unmounts cleanly
 * - renders nothing on the server (never blocks content with JS off) and
 *   skips entirely under reduced motion; aria-hidden, never traps focus
 */
export default function Preloader({ logoText = "CHARACOM" }: PreloaderProps) {
  const { reduced } = useReducedMotionPref();
  const [phase, setPhase] = useState<Phase>("pending");
  const started = useRef(false);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  /* Decide once on mount: play, or skip (reduced motion only). */
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    /* The provider hook may not have hydrated its persisted toggle yet at
       this point, so also consult the media query + mirrored html attribute
       directly — the preloader must never block under reduced motion. */
    const prefersReduced =
      reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-reduced-motion") === "true";

    setPhase(prefersReduced ? "done" : "playing");
  }, [reduced]);

  /* If the user preference flips to reduced mid-sequence, end immediately. */
  useEffect(() => {
    if (reduced && phase === "playing") setPhase("exiting");
  }, [reduced, phase]);

  /* Count 0 → 100 via rAF (direct DOM writes — no re-render per frame),
     then hold briefly and exit. Hard cap at DUR.preloaderMax. */
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

  if (phase === "pending" || phase === "done") return null;

  return (
    <AnimatePresence onExitComplete={() => setPhase("done")}>
      {phase === "playing" && (
        <motion.div
          aria-hidden="true"
          role="presentation"
          className="gold-mesh fixed inset-0 z-[100] select-none text-plaster"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.15 } }
              : {
                  y: "-100%",
                  transition: { duration: DUR.base, ease: EASE_IN_OUT },
                }
          }
        >
          {/* Small wordmark, top-left */}
          <div className="absolute left-[var(--gutter)] top-8 flex items-baseline gap-3">
            <span className="font-display text-2xl font-medium tracking-[0.02em]">
              {logoText}
              <span className="text-gold-bright">.</span>
            </span>
            <span className="hidden text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/40 sm:inline">
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
          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
            <div
              ref={barRef}
              className="h-full w-full origin-left scale-x-0 bg-gold"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
