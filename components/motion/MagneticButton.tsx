"use client";

import type React from "react";
import { motion } from "motion/react";
import { MAGNETIC_RANGE } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useMagnetic } from "./useMagnetic";

export interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  /** max pull distance in px (default MAGNETIC_RANGE = ±8) */
  range?: number;
}

/**
 * Magnetic wrapper (ARCHITECTURE §3.4): the wrapped element is pulled toward
 * the cursor by up to ±range px on a spring, and springs back on leave.
 * Framer owns this element. Desktop fine-pointer only — inert on touch and
 * under reduced motion (§6.4), where children render completely static.
 */
export default function MagneticButton({
  children,
  className,
  range = MAGNETIC_RANGE,
}: MagneticButtonProps) {
  const { ref, x, y } = useMagnetic<HTMLDivElement>(range);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
