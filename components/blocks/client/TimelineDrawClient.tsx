"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * The vertical gold line of the full timeline (ARCHITECTURE.md §5.6.1):
 * draws top → bottom scrubbed to scroll, using its parent (the timeline
 * container) as the trigger. Server-renders fully drawn, so no-JS and
 * reduced-motion users simply see the complete line.
 */

export default function TimelineDrawClient({
  className,
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const trigger = el.parentElement ?? el;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top center",
          scrollTrigger: {
            trigger,
            start: "top 70%",
            end: "bottom 60%",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} aria-hidden="true" className={cn("origin-top", className)} />
  );
}
