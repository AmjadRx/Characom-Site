"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Hero foreground wrapper (ARCHITECTURE.md §5.1.1): the content parallaxes up
 * at 0.85x scroll speed and fades out as the hero scrolls away (GSAP scrub),
 * plus the pulsing "SCROLL" cue (thin vertical line, loop paused off-screen).
 * Reduced motion: everything renders statically.
 */

export default function HeroContentClient({
  children,
  showScrollCue = true,
  className,
}: {
  children: ReactNode;
  showScrollCue?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const cueLineRef = useRef<HTMLSpanElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content || reduced) return;
    const section = root.closest("section") ?? root;

    const ctx = gsap.context(() => {
      // Content moves at 0.85x of scroll (drifts +15% of hero height) + fade.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
          defaults: { ease: "none" },
        })
        .to(content, { y: () => section.clientHeight * 0.15, duration: 1 }, 0)
        .to(content, { opacity: 0, duration: 0.6 }, 0);

      const cue = cueRef.current;
      const cueLine = cueLineRef.current;
      if (cue && cueLine) {
        gsap.to(cue, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "25% top",
            scrub: true,
          },
        });

        const pulse = gsap
          .timeline({ repeat: -1, repeatDelay: 0.35 })
          .fromTo(
            cueLine,
            { scaleY: 0, transformOrigin: "top center" },
            { scaleY: 1, duration: 0.9, ease: EASE.inOut },
          )
          .to(
            cueLine,
            {
              scaleY: 0,
              transformOrigin: "bottom center",
              duration: 0.7,
              ease: EASE.inOut,
            },
            ">0.2",
          );

        // Nothing animates off-screen (§6.3).
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => pulse.play(),
          onEnterBack: () => pulse.play(),
          onLeave: () => pulse.pause(0),
          onLeaveBack: () => pulse.pause(0),
        });
      }
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div ref={contentRef} className="w-full">
        {children}
      </div>
      {showScrollCue ? (
        <div
          ref={cueRef}
          className="pointer-events-none absolute bottom-9 left-[var(--gutter)] hidden flex-col items-center gap-3 sm:flex"
        >
          <span className="text-[10px] font-semibold tracking-[0.3em] text-plaster/60 uppercase [writing-mode:vertical-rl]">
            Scroll
          </span>
          <span
            ref={cueLineRef}
            className="block h-14 w-px bg-gold-bright/70"
            aria-hidden="true"
          />
        </div>
      ) : null}
    </div>
  );
}
