"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DUR, EASE_FM, SPRING } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";
import { useMagnetic } from "./useMagnetic";

export interface MorphButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "gold" | "ghost";
  loading?: boolean;
  success?: boolean;
  className?: string;
  /** set when rendered on a dark (ink) section */
  dark?: boolean;
}

const MotionLink = motion.create(Link);

/**
 * Signature pill CTA (ARCHITECTURE §3.4): on hover a gold wipe fills from the
 * left while the border-radius morphs pill → square-ish; subtle magnetic pull
 * (desktop only); quick scale to 0.97 on press with spring overshoot back.
 * `loading` swaps the label for a spinner; `success` morphs the button into a
 * cypress check panel (contact form). Renders a Next <Link> when `href` is
 * given, otherwise a <button>. Framer owns this element.
 *
 * Reduced motion (§6.4): magnetic/wipe/morph disabled — hover degrades to a
 * plain color swap, success panel to a crossfade.
 */
export default function MorphButton({
  label,
  href,
  onClick,
  type = "button",
  variant = "gold",
  loading = false,
  success = false,
  className,
  dark = false,
}: MorphButtonProps) {
  const { reduced } = useReducedMotionPref();
  const { ref, x, y } = useMagnetic<HTMLElement>();
  const [hovered, setHovered] = useState(false);
  const engaged = hovered && !loading && !success;

  /* Surface colors per variant + context. */
  const surface =
    variant === "gold"
      ? dark
        ? "bg-gold text-ink"
        : "bg-ink text-plaster"
      : dark
        ? "border border-white/30 text-plaster"
        : "border border-ink/30 text-ink";

  /* Gold wipe color — on a gold base the wipe brightens instead. */
  const wipeBg = variant === "gold" && dark ? "bg-gold-bright" : "bg-gold";

  /* Reduced-motion hover fallback: instant-ish color swap via CSS only. */
  const reducedHover =
    variant === "gold"
      ? dark
        ? "hover:bg-gold-bright"
        : "hover:bg-gold hover:text-ink"
      : "hover:border-gold hover:bg-gold hover:text-ink";

  const rootClass = cn(
    "group relative inline-flex min-h-12 select-none items-center justify-center overflow-hidden whitespace-nowrap px-8 py-3 font-display text-[0.9375rem] font-semibold leading-none tracking-[0.01em] transition-colors duration-300",
    surface,
    engaged && variant === "ghost" && "border-gold",
    reduced && reducedHover,
    loading && "cursor-wait",
    className,
  );

  const style = { x, y, borderRadius: 999 };
  const animate = { borderRadius: !reduced && engaged ? 12 : 999 };
  const transition = {
    borderRadius: { duration: DUR.fast, ease: EASE_FM.out },
    scale: {
      type: "spring" as const,
      stiffness: SPRING.stiffness,
      damping: SPRING.damping,
      mass: SPRING.mass,
    },
  };
  const whileTap = reduced || loading || success ? undefined : { scale: 0.97 };

  const interaction = {
    onHoverStart: () => setHovered(true),
    onHoverEnd: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  const inner = (
    <>
      {/* Gold wipe filling from the left (Framer — hover-owned). */}
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className={cn("absolute inset-0 z-0 origin-left", wipeBg)}
          initial={false}
          animate={{ scaleX: engaged ? 1 : 0 }}
          transition={{
            duration: engaged ? DUR.base * 0.7 : DUR.fast,
            ease: EASE_FM.outHard,
          }}
        />
      )}

      <span
        className={cn(
          "relative z-10 transition-colors duration-300",
          engaged && !reduced && "text-ink",
          loading && "opacity-0",
        )}
      >
        {label}
      </span>

      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            className="h-5 w-5 animate-spin"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        </span>
      )}

      {/* Success check panel — slides up (crossfades under reduced motion). */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cypress text-plaster"
        initial={false}
        animate={
          reduced
            ? { y: "0%", opacity: success ? 1 : 0 }
            : { y: success ? "0%" : "101%", opacity: 1 }
        }
        transition={{ duration: DUR.fast, ease: EASE_FM.outHard }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <motion.path
            d="M4.5 12.5l5 5 10-11"
            initial={false}
            animate={{ pathLength: success ? 1 : 0 }}
            transition={{
              duration: DUR.fast,
              ease: EASE_FM.out,
              delay: success && !reduced ? 0.15 : 0,
            }}
          />
        </svg>
      </motion.span>

      <span role="status" className="sr-only">
        {loading ? "Loading" : success ? "Success" : ""}
      </span>
    </>
  );

  if (href) {
    return (
      <MotionLink
        href={href}
        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
        className={rootClass}
        style={style}
        initial={false}
        animate={animate}
        transition={transition}
        whileTap={whileTap}
        aria-busy={loading || undefined}
        {...interaction}
      >
        {inner}
      </MotionLink>
    );
  }

  return (
    <motion.button
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={loading || success}
      className={rootClass}
      style={style}
      initial={false}
      animate={animate}
      transition={transition}
      whileTap={whileTap}
      aria-busy={loading || undefined}
      {...interaction}
    >
      {inner}
    </motion.button>
  );
}
