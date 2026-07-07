"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface PinnedSceneProps {
  children: React.ReactNode[];
  className?: string;
  heading?: React.ReactNode;
}

/**
 * Horizontal showcase (ARCHITECTURE §6.2): on viewports ≥1024px the section
 * pins and the slides scrub horizontally with the scroll (GSAP — the natural
 * scroll distance equals the hidden horizontal overflow, so pacing feels
 * 1:1). Below 1024px and under reduced motion (§6.4) it renders a plain
 * vertical stack — no pin, no ScrollTrigger.
 *
 * SSR renders the vertical stack (mobile-first, hydration-safe); the pinned
 * layout activates after mount on qualifying viewports.
 */
export default function PinnedScene({
  children,
  className,
  heading,
}: PinnedSceneProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { reduced } = useReducedMotionPref();
  const [horizontal, setHorizontal] = useState(false);

  useEffect(() => {
    if (reduced) {
      setHorizontal(false);
      return;
    }
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setHorizontal(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduced]);

  useLayoutEffect(() => {
    if (!horizontal) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none", // scrubbed — position is fully scroll-driven
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            track.style.willChange = self.isActive ? "transform" : "";
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, [horizontal, children.length]);

  return (
    <div ref={sectionRef} className={cn("relative", className)}>
      <div
        className={
          horizontal
            ? "flex h-screen flex-col justify-center overflow-hidden"
            : "section-pad"
        }
      >
        {heading ? (
          <div className="container-site pb-10 lg:pb-12">{heading}</div>
        ) : null}
        <div
          ref={trackRef}
          className={
            horizontal
              ? "flex w-max items-stretch gap-[3vw] px-[var(--gutter)]"
              : "container-site flex flex-col gap-10"
          }
        >
          {children.map((slide, index) => (
            <div
              key={index}
              className={horizontal ? "w-[min(76vw,920px)] shrink-0" : undefined}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
