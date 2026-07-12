"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, TRIGGER } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

/**
 * CTA band entrance (ARCHITECTURE.md §5.1.8): the band scales 0.96 → 1 and
 * fades in once when it enters the viewport (GSAP, fired once — not a scrub).
 * Reduced motion / no-JS: renders in its final state.
 */

export default function CtaBandClient({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: DUR.slow,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: TRIGGER.start, once: true },
          onStart: () => {
            el.style.willChange = "transform, opacity";
          },
          onComplete: () => {
            gsap.set(el, { clearProps: "willChange,transform,opacity" });
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
