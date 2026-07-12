"use client";

import { useLayoutEffect, useRef } from "react";
import type React from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, TRIGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface RevealProps {
  children: React.ReactNode;
  variant?: "fade" | "rise" | "clip" | "scale";
  delay?: number;
  duration?: number;
  /** rise distance in px (rise/clip variants) */
  y?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Viewport-triggered reveal, fired once at TRIGGER.start (GSAP owns it —
 * scroll-linked). Server-rendered content stays visible until hydration, so
 * pages read fine without JS; under reduced motion the effect is skipped and
 * the element simply renders in its final state (§6.4).
 */
export default function Reveal({
  children,
  variant = "rise",
  delay = 0,
  duration = DUR.base,
  y = 32,
  className,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const from: gsap.TweenVars = { opacity: 0 };
      const to: gsap.TweenVars = {
        opacity: 1,
        duration,
        delay,
        ease: variant === "fade" ? EASE.out : EASE.outHard,
        scrollTrigger: { trigger: el, start: TRIGGER.start, once: true },
        onStart: () => {
          // will-change just-in-time; removed with clearProps below.
          el.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          gsap.set(el, {
            clearProps: "willChange,transform,opacity,clipPath",
          });
        },
      };

      if (variant === "rise") {
        from.y = y;
        to.y = 0;
      } else if (variant === "scale") {
        from.scale = 0.95;
        to.scale = 1;
      } else if (variant === "clip") {
        from.clipPath = "inset(0% 0% 100% 0%)";
        to.clipPath = "inset(0% 0% 0% 0%)";
        from.y = Math.min(y, 24);
        to.y = 0;
      }

      gsap.fromTo(el, from, to);
    }, el);

    return () => ctx.revert();
  }, [reduced, variant, delay, duration, y]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
