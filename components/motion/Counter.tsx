"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, TRIGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface CounterProps {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

/**
 * Stat counter (ARCHITECTURE §3.4): counts 0 → value once when scrolled into
 * view (GSAP, TRIGGER.counterStart), the suffix pops in after the count
 * settles. `tabular-nums` prevents width jitter while counting.
 *
 * a11y/SSR: the final value is server-rendered and kept in an sr-only span;
 * the animated copy is aria-hidden. Under reduced motion (§6.4) the final
 * value renders immediately — no animation runs.
 */
export default function Counter({
  value,
  suffix,
  className,
  duration = DUR.slow * 1.8,
}: CounterProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const suffixRef = useRef<HTMLSpanElement>(null);
  const { reduced } = useReducedMotionPref();

  // Preserve up to 2 decimal places of the target value while counting.
  const decimals = Math.min((String(value).split(".")[1] ?? "").length, 2);
  const format = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const num = numRef.current;
    if (!root || !num || reduced) return;
    const suffixEl = suffixRef.current;

    const ctx = gsap.context(() => {
      const state = { n: 0 };
      // Reset to 0 before paint (useLayoutEffect) so there is no flash of
      // the final value between hydration and the scroll trigger firing.
      num.textContent = format(0);
      if (suffixEl) {
        gsap.set(suffixEl, { opacity: 0, scale: 0.4, willChange: "transform, opacity" });
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: TRIGGER.counterStart, once: true },
        onComplete: () => {
          if (suffixEl) gsap.set(suffixEl, { clearProps: "willChange" });
        },
      });

      tl.to(state, {
        n: value,
        duration,
        ease: EASE.expo,
        onUpdate: () => {
          num.textContent = format(state.n);
        },
      });

      if (suffixEl) {
        // "Pop": overshoot to 1.15 then settle — built from tokened eases.
        tl.to(
          suffixEl,
          { opacity: 1, scale: 1.15, duration: DUR.fast * 0.5, ease: EASE.out },
          ">-0.2",
        ).to(suffixEl, { scale: 1, duration: DUR.fast * 0.5, ease: EASE.out });
      }
    }, root);

    return () => ctx.revert();
    // `format` derives entirely from `value` (via decimals).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, value, duration, decimals]);

  return (
    <span ref={rootRef} className={cn("inline-flex items-baseline", className)}>
      <span className="sr-only">
        {format(value)}
        {suffix ?? ""}
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        <span ref={numRef} className="tabular-nums">
          {format(value)}
        </span>
        {suffix ? (
          <span ref={suffixRef} className="inline-block">
            {suffix}
          </span>
        ) : null}
      </span>
    </span>
  );
}
