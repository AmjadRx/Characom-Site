"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import SplitType from "split-type";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * "Reading light" body (ARCHITECTURE.md §5.1.3): the paragraph text is split
 * into lines client-side; each line's opacity ramps 15% → 100% scrubbed as it
 * crosses the viewport center. Blank lines in the source text start a new
 * paragraph. Reduced motion / no-JS: plain full-opacity paragraphs.
 */

export default function ImageWithTextBodyClient({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { reduced } = useReducedMotionPref();

  const paragraphs = useMemo(
    () =>
      (text ?? "")
        .split(/\r?\n\s*\r?\n/)
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    [text],
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || paragraphs.length === 0) return;

    let split: SplitType | null = null;
    let ctx: gsap.Context | null = null;

    const teardown = () => {
      ctx?.revert();
      ctx = null;
      split?.revert();
      split = null;
    };

    const build = () => {
      teardown();
      const paras = Array.from(el.querySelectorAll<HTMLElement>("p"));
      if (paras.length === 0) return;
      split = new SplitType(paras, { types: "lines", tagName: "span" });
      const lines = split.lines ?? [];
      if (lines.length === 0) return;

      ctx = gsap.context(() => {
        for (const line of lines) {
          gsap.fromTo(
            line,
            { opacity: 0.15 },
            {
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: line,
                start: "top 72%",
                end: "top 45%",
                scrub: true,
              },
            },
          );
        }
      }, el);
    };

    build();

    // Re-split on width changes only.
    let lastWidth = window.innerWidth;
    let resizeTimer: number | undefined;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      teardown();
    };
  }, [reduced, paragraphs]);

  if (paragraphs.length === 0) return null;

  return (
    <div ref={ref} className={cn(className)}>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
