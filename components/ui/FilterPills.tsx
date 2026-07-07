"use client";

import { useId, useRef } from "react";
import type React from "react";
import { motion } from "framer-motion";
import type { ThemeColor } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

export interface FilterPillsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  theme?: ThemeColor;
  /** accessible name for the radiogroup */
  label?: string;
  className?: string;
}

const FILL: Record<ThemeColor, string> = {
  gold: "var(--gold)",
  cypress: "var(--cypress)",
  aegean: "var(--aegean)",
};

/** Active-pill text color chosen for WCAG AA contrast on each theme fill. */
const ACTIVE_TEXT: Record<ThemeColor, string> = {
  gold: "var(--ink)",
  cypress: "var(--white)",
  aegean: "var(--white)",
};

/**
 * Animated filter pills (CONTRACTS.md — components/ui). The active pill fill
 * is a shared-layout Framer element (layoutId) that glides between options.
 * Semantics: radiogroup with roving tabindex — arrow keys move and select.
 */
export default function FilterPills({
  options,
  value,
  onChange,
  theme = "gold",
  label = "Filter",
  className,
}: FilterPillsProps) {
  const layoutId = useId();
  const { reduced } = useReducedMotionPref();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = options.findIndex((o) => o.value === value);
  const tabbableIndex = activeIndex >= 0 ? activeIndex : 0;

  const selectAt = (rawIndex: number) => {
    if (options.length === 0) return;
    const i = ((rawIndex % options.length) + options.length) % options.length;
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    refs.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        selectAt(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        selectAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        selectAt(0);
        break;
      case "End":
        e.preventDefault();
        selectAt(options.length - 1);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {options.map((opt, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={i === tabbableIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors duration-300",
              active
                ? "border-transparent"
                : "border-ink/20 text-ink/70 hover:border-ink/45 hover:text-ink [.on-dark_&]:border-white/20 [.on-dark_&]:text-plaster/70 [.on-dark_&]:hover:border-white/45 [.on-dark_&]:hover:text-plaster",
            )}
            style={active ? { color: ACTIVE_TEXT[theme] } : undefined}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-pill"
                style={{ background: FILL[theme] }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: SPRING.stiffness,
                        damping: SPRING.damping + 5,
                        mass: SPRING.mass,
                      }
                }
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { FilterPills };
