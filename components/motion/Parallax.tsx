"use client";

import { useLayoutEffect, useRef } from "react";
import type React from "react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface ParallaxProps {
  children: React.ReactNode;
  /** 0.85 = moves slower than the page; 1 = no offset (static). */
  speed?: number;
  className?: string;
}

/**
 * Scroll-scrubbed y-offset (GSAP owns it — scroll-linked). The inner element
 * drifts through ±(1 − speed) · 50vh while the outer wrapper travels through
 * the viewport, so at mid-viewport it sits exactly where the layout put it.
 *
 * will-change is applied only while the trigger is active; under reduced
 * motion (§6.4) children render statically with no ScrollTrigger created.
 */
export default function Parallax({
  children,
  speed = 0.9,
  className,
}: ParallaxProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || reduced || speed === 1) return;

    const ctx = gsap.context(() => {
      // Total travel relative to natural scroll over one viewport pass.
      const travel = () => (1 - speed) * window.innerHeight;
      gsap.fromTo(
        inner,
        { y: () => -travel() / 2 },
        {
          y: () => travel() / 2,
          ease: "none", // linear — position is fully scroll-driven
          scrollTrigger: {
            trigger: outer,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              inner.style.willChange = self.isActive ? "transform" : "";
            },
          },
        },
      );
    }, outer);

    return () => ctx.revert();
  }, [reduced, speed]);

  return (
    <div ref={outerRef} className={className}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
