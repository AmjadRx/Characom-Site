"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";

export interface KenBurnsProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * next/image wrapper with a very slow Ken Burns drift: scale 1 → 1.06 looping
 * (yoyo), paused whenever the element is off-screen (ScrollTrigger gate —
 * §6.3: nothing animates off-screen). The tween runs on a wrapper div, never
 * on the <img> itself, so it can't fight next/image internals.
 *
 * Size the frame via className (e.g. aspect-* / h-*). Under reduced motion
 * the image renders static at scale 1 (§6.4).
 */
export default function KenBurns({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
}: KenBurnsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { reduced } = useReducedMotionPref();

  useLayoutEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame || reduced) return;

    const ctx = gsap.context(() => {
      const tween = gsap.fromTo(
        frame,
        { scale: 1 },
        {
          scale: 1.06,
          // ≈13s per leg — DUR.slow scaled up so the drift stays subliminal.
          duration: DUR.slow * 12,
          ease: EASE.inOut,
          repeat: -1,
          yoyo: true,
          paused: true,
        },
      );

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive) {
            frame.style.willChange = "transform";
            tween.play();
          } else {
            tween.pause();
            frame.style.willChange = "";
          }
        },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className={cn("relative overflow-hidden", className)}>
      <div ref={frameRef} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    </div>
  );
}
