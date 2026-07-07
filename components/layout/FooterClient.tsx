"use client";

import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/motion";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Small client islands used by the (server) SiteFooter:
 * - BackToTop: magnetic circular button that scrolls to the top
 * - MotionToggle: the sitewide reduced-motion switch (useReducedMotionPref)
 */

export function BackToTop() {
  const { reduced } = useReducedMotionPref();
  return (
    <MagneticButton>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: reduced ? "auto" : "smooth",
          })
        }
        className="group flex h-14 w-14 items-center justify-center rounded-pill border border-white/15 text-plaster transition-colors duration-300 hover:border-gold hover:text-gold-bright focus-visible:border-gold"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 transition-transform duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-0.5"
        >
          <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
        </svg>
      </button>
    </MagneticButton>
  );
}

export function MotionToggle() {
  const { reduced, toggle } = useReducedMotionPref();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={reduced}
      onClick={toggle}
      className="group inline-flex items-center gap-3 text-sm text-plaster/60 transition-colors duration-300 hover:text-plaster focus-visible:text-plaster"
    >
      <span>Reduce motion</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-block h-5 w-9 rounded-pill border transition-colors duration-300",
          reduced ? "border-gold bg-gold/25" : "border-white/20 bg-white/5",
        )}
      >
        <span
          className={cn(
            "absolute left-[3px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-pill transition-transform duration-300 [transition-timing-function:var(--ease-out-expo)]",
            reduced ? "translate-x-4 bg-gold" : "translate-x-0 bg-plaster/60",
          )}
        />
      </span>
    </button>
  );
}
