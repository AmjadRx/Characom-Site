"use client";

import { useEffect, useRef, useState } from "react";
import { MorphButton } from "@/components/motion";
import { useReducedMotionPref } from "@/components/providers";
import { cn } from "@/lib/utils";

/**
 * Client-side demo islands for the /dev/motion playground.
 * Not part of any public contract — playground only.
 */

/** Simulated form submit: idle → loading (spinner) → success (check panel). */
export function MorphButtonDemo() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const simulate = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setSuccess(false);
    setLoading(true);
    timers.current.push(
      window.setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 1600),
      window.setTimeout(() => setSuccess(false), 4200),
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-6">
      <MorphButton
        label="Send message"
        onClick={simulate}
        loading={loading}
        success={success}
      />
      <p className="max-w-xs text-sm text-stone">
        Click to simulate a contact-form submit: spinner, then the check panel.
        Resets itself after a few seconds.
      </p>
    </div>
  );
}

/** Sitewide reduced-motion switch — flip it to verify every primitive degrades. */
export function MotionSwitch({ dark = false }: { dark?: boolean }) {
  const { reduced, toggle } = useReducedMotionPref();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={reduced}
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-3 rounded-pill border px-4 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-300",
        dark
          ? "border-white/25 text-plaster hover:border-gold-bright"
          : "border-ink/25 text-ink hover:border-gold-deep",
      )}
    >
      Reduced motion
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-4 w-8 items-center rounded-pill border transition-colors duration-300",
          reduced
            ? "border-gold bg-gold"
            : dark
              ? "border-white/40 bg-transparent"
              : "border-ink/40 bg-transparent",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-transform duration-300",
            reduced
              ? "translate-x-[1.125rem] bg-ink"
              : dark
                ? "translate-x-1 bg-plaster"
                : "translate-x-1 bg-ink",
          )}
        />
      </span>
      <span className="sr-only">{reduced ? "on" : "off"}</span>
    </button>
  );
}
