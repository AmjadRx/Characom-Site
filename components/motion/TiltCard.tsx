"use client";

import type React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { SPRING, TILT_MAX } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";
import { useFinePointer } from "./useMagnetic";

export interface TiltCardProps {
  children: React.ReactNode;
  theme?: "gold" | "cypress" | "aegean";
  className?: string;
  imageScaleOnHover?: boolean;
}

/** Cursor-following glow color per category theme (low-alpha via color-mix). */
const GLOW: Record<NonNullable<TiltCardProps["theme"]>, string> = {
  gold: "color-mix(in srgb, var(--gold) 22%, transparent)",
  cypress: "color-mix(in srgb, var(--cypress) 28%, transparent)",
  aegean: "color-mix(in srgb, var(--aegean) 28%, transparent)",
};

/**
 * 3D tilt card (ARCHITECTURE §3.4): tilts toward the cursor (max ±TILT_MAX°,
 * perspective 900px), springs back on leave, with a cursor-following radial
 * glow in the card's theme color and an optional slow image scale 1 → 1.06.
 * Framer owns this element (hover interaction — never mix GSAP onto it).
 *
 * Desktop fine-pointer only; fully static on touch and under reduced motion.
 */
export default function TiltCard({
  children,
  theme = "gold",
  className,
  imageScaleOnHover = true,
}: TiltCardProps) {
  const { reduced } = useReducedMotionPref();
  const fine = useFinePointer();
  const enabled = fine && !reduced;

  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useSpring(0, SPRING);
  const glow = useMotionTemplate`radial-gradient(300px circle at ${glowX}% ${glowY}%, ${GLOW[theme]}, transparent 70%)`;

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width; // 0..1
    const py = (event.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * TILT_MAX);
    rotateX.set(-(py - 0.5) * 2 * TILT_MAX);
    glowX.set(px * 100);
    glowY.set(py * 100);
  };

  const onMouseEnter = () => {
    if (enabled) glowOpacity.set(1);
  };

  const onMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn(
        "relative rounded-card",
        // Slow media zoom (1100ms mirrors DUR.slow) — caller's figure must
        // clip via overflow-hidden.
        enabled &&
          imageScaleOnHover &&
          "[&_img]:transition-transform [&_img]:duration-[1100ms] [&_img]:ease-[var(--ease-out-quart)] [&:hover_img]:scale-[1.06]",
        className,
      )}
    >
      {children}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: glow, opacity: glowOpacity }}
      />
    </motion.div>
  );
}
