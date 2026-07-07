"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

const SESSION_KEY = "characom-preloaded";
/** counting portion of the sequence — exit wipe keeps total < DUR.preloaderMax */
const COUNT_MS = 1400;
const HOLD_MS = 200;

const EASE_IN_OUT: [number, number, number, number] = [...EASE_FM.inOut];

type Phase = "pending" | "playing" | "exiting" | "done";

export interface PreloaderProps {
  /** wordmark shown in the mask reveal; defaults to the brand name */
  logoText?: string;
}

/**
 * First-visit preloader (ARCHITECTURE §3.4), gated per session via
 * sessionStorage "characom-preloaded".
 * - counts 0 → 100% with a logo mask reveal (clip-path, rAF-driven)
 * - hard-capped at DUR.preloaderMax, then wipes away and unmounts cleanly
 * - renders nothing on the server (never blocks content with JS off) and
 *   skips entirely under reduced motion
 * - aria-hidden, no focusable elements — it never traps focus
 */
export default function Preloader({ logoText = "CHARACOM" }: PreloaderProps) {
  const { reduced } = useReducedMotionPref();
  const [phase, setPhase] = useState<Phase>("pending");
  const started = useRef(false);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const maskRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  /* Decide once on mount: play, or skip (already seen / reduced motion). */
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* storage unavailable — treat as played so we never loop */
      alreadyPlayed = true;
    }

    /* The provider hook may not have hydrated its persisted toggle yet at
       this point, so also consult the media query + mirrored html attribute
       directly — the preloader must never block under reduced motion. */
    const prefersReduced =
      reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-reduced-motion") === "true";

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    if (alreadyPlayed || prefersReduced) {
      setPhase("done");
      return;
    }
    setPhase("playing");
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
      if (maskRef.current)
        maskRef.current.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
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
          className="gold-mesh fixed inset-0 z-[100] flex items-center justify-center text-plaster"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.15 } }
              : {
                  y: "-100%",
                  transition: { duration: DUR.base, ease: EASE_IN_OUT },
                }
          }
        >
          <div className="container-site">
            {/* Logo mask reveal */}
            <div className="relative inline-block select-none font-display text-[clamp(2.5rem,8vw,6rem)] font-semibold leading-none tracking-[-0.03em]">
              <span className="text-plaster/15">
                {logoText}
                <span className="text-gold/20">.</span>
              </span>
              <span
                ref={maskRef}
                className="absolute inset-0 text-plaster"
                style={{ clipPath: "inset(0 100% 0 0)" }}
              >
                {logoText}
                <span className="text-gold-bright">.</span>
              </span>
            </div>

            {/* Gold hairline progress */}
            <div className="mt-8 h-px w-full max-w-md overflow-hidden bg-white/10">
              <div
                ref={barRef}
                className="h-full w-full origin-left scale-x-0 bg-gold"
              />
            </div>
          </div>

          {/* Counter, bottom-right */}
          <div className="absolute bottom-8 right-[var(--gutter)] font-display text-[clamp(1.5rem,4vw,2.5rem)] font-semibold tracking-[-0.02em] text-plaster/70 tabular-nums">
            <span ref={counterRef}>0</span>
            <span className="text-gold-bright">%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
