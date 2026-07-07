"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

const EASE_OUT_HARD: [number, number, number, number] = [...EASE_FM.outHard];

/**
 * Case-study cover (ARCHITECTURE §5.4): full-bleed image that zooms out
 * 1.15 → 1 on load. Framer owns it (lifecycle animation — transform only).
 * Under reduced motion the image renders statically at scale 1.
 */
export default function CaseCover({ src, alt }: { src: string; alt: string }) {
  const { reduced } = useReducedMotionPref();
  const systemReduced = useReducedMotion();
  const skip = reduced || Boolean(systemReduced);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {src ? (
        <motion.div
          className="absolute inset-0"
          initial={skip ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: DUR.slow, ease: EASE_OUT_HARD }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-ink-soft" />
      )}
      {/* ink scrim keeps the title legible over any imagery */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10"
      />
    </div>
  );
}
