"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, type MotionValue } from "framer-motion";
import { MAGNETIC_RANGE, SPRING } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

/**
 * Internal helpers shared by MagneticButton / MorphButton / TiltCard.
 * Not part of the public contract — not re-exported from index.ts.
 */

/** True on devices with a fine pointer + hover (i.e. desktop mouse/trackpad). */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return fine;
}

export interface MagneticValues<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/**
 * ±`range`px spring pull toward the cursor (ARCHITECTURE §3.4). Desktop
 * fine-pointer only; fully inert on touch and under reduced motion (§6.4).
 * Attach `ref` to the element and feed `x`/`y` into a Framer `style`.
 */
export function useMagnetic<T extends HTMLElement>(
  range: number = MAGNETIC_RANGE,
): MagneticValues<T> {
  const ref = useRef<T | null>(null);
  const { reduced } = useReducedMotionPref();
  const fine = useFinePointer();
  const enabled = fine && !reduced;

  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      x.set(0);
      y.set(0);
      return;
    }

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      // Scale offset-from-center down to ±range px.
      x.set(Math.max(-range, Math.min(range, (dx / (rect.width / 2)) * range)));
      y.set(Math.max(-range, Math.min(range, (dy / (rect.height / 2)) * range)));
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      x.set(0);
      y.set(0);
    };
  }, [enabled, range, x, y]);

  return { ref, x, y };
}
