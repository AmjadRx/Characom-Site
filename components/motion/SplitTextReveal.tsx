"use client";

import { useLayoutEffect, useRef } from "react";
import type React from "react";
import SplitType from "split-type";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER, TRIGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface SplitTextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  delay?: number;
}

/**
 * Headline reveal (ARCHITECTURE.md §3.4): SplitType splits the text into
 * lines, each line is masked (`.split-line-mask .line` in globals.css) and
 * its words rise together 110% → 0 with STAGGER.lines between lines,
 * EASE.outHard, triggered once at TRIGGER.start.
 *
 * a11y: the original text stays available to assistive tech via an sr-only
 * copy; the split visual copy is aria-hidden. Re-splits on width resize and,
 * once played, simply re-renders the final state. Reduced motion: plain text.
 */
export default function SplitTextReveal({
  text,
  as = "h2",
  className,
  delay = 0,
}: SplitTextRevealProps) {
  const visualRef = useRef<HTMLSpanElement>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const el = visualRef.current;
    if (!el || reduced) return;

    let split: SplitType | null = null;
    let timeline: gsap.core.Timeline | null = null;
    let trigger: ScrollTrigger | null = null;
    let played = false;

    const teardown = () => {
      trigger?.kill();
      trigger = null;
      timeline?.kill();
      timeline = null;
      split?.revert();
      split = null;
    };

    const build = () => {
      teardown();
      split = new SplitType(el, { types: ["lines", "words"], tagName: "span" });
      const lines = split.lines ?? [];
      if (lines.length === 0) return;

      // Breathing room inside the line mask so descenders aren't clipped.
      gsap.set(lines, { paddingBottom: "0.1em", marginBottom: "-0.1em" });

      const wordsPerLine = lines.map((line) =>
        Array.from(line.querySelectorAll<HTMLElement>(".word")),
      );

      if (played) {
        // Already revealed — new layout just renders the final state.
        wordsPerLine.forEach((words) => gsap.set(words, { yPercent: 0 }));
        return;
      }

      wordsPerLine.forEach((words) =>
        gsap.set(words, { yPercent: 110, willChange: "transform" }),
      );

      timeline = gsap.timeline({
        paused: true,
        delay,
        onComplete: () => {
          played = true;
          gsap.set(el.querySelectorAll<HTMLElement>(".word"), {
            clearProps: "willChange",
          });
        },
      });
      wordsPerLine.forEach((words, lineIndex) => {
        timeline?.to(
          words,
          { yPercent: 0, duration: DUR.slow, ease: EASE.outHard },
          lineIndex * STAGGER.lines,
        );
      });

      trigger = ScrollTrigger.create({
        trigger: el,
        start: TRIGGER.start,
        once: true,
        onEnter: () => timeline?.play(),
      });
    };

    build();

    // Refit on width changes only (mobile URL-bar height changes are noise).
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
  }, [reduced, text, delay]);

  const Tag = as as React.ElementType;
  return (
    <Tag className={cn(className)}>
      <span className="sr-only">{text}</span>
      <span
        ref={visualRef}
        aria-hidden="true"
        className="split-line-mask block"
      >
        {text}
      </span>
    </Tag>
  );
}
