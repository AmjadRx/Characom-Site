"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, TRIGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface DrawLineProps {
  orientation?: "h" | "v";
  className?: string;
  delay?: number;
}

/**
 * Rule line that draws itself in on scroll: scaleX (or scaleY) 0 → 1 from the
 * left/top edge, once at TRIGGER.start. Inherits color via `bg-current` so it
 * follows the section's text color; override thickness/color via className.
 * Decorative only (aria-hidden). Reduced motion: renders fully drawn (§6.4).
 */
export default function DrawLine({
  orientation = "h",
  className,
  delay = 0,
}: DrawLineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        orientation === "h" ? { scaleX: 0 } : { scaleY: 0 },
        {
          scaleX: 1,
          scaleY: 1,
          duration: DUR.slow,
          delay,
          ease: EASE.outHard,
          scrollTrigger: { trigger: el, start: TRIGGER.start, once: true },
          onStart: () => {
            el.style.willChange = "transform";
          },
          onComplete: () => {
            gsap.set(el, { clearProps: "willChange,transform" });
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, orientation, delay]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "block bg-current",
        orientation === "h" ? "h-px w-full origin-left" : "h-full w-px origin-top",
        className,
      )}
    />
  );
}
