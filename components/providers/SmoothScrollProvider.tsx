"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotionPref } from "./ReducedMotionProvider";

/**
 * Lenis smooth scroll driven by GSAP's ticker — one shared RAF loop for the
 * whole site (ARCHITECTURE.md §6.1). ScrollTrigger is updated on every Lenis
 * scroll event so scrubbed/pinned scenes stay perfectly in sync.
 *
 * Disabled entirely on touch devices (native inertial scroll is better) and
 * under reduced motion (§6.4) — in both cases children render unchanged and
 * the browser scrolls natively.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { reduced } = useReducedMotionPref();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      // Smooth-scroll anchor jumps too (skip-to-content, #hash links).
      anchors: true,
    });

    lenis.on("scroll", () => ScrollTrigger.update());

    const tick = (time: number) => {
      // GSAP ticker time is seconds; Lenis wants ms.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    // Lenis owns frame pacing now; lag smoothing would fight it.
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      // Restore GSAP's default lag smoothing for the native-scroll fallback.
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [reduced]);

  return <>{children}</>;
}
