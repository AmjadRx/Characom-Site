"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, TRIGGER } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

export type ContactMethodKind = "phone" | "email" | "fax" | "address";

export interface ContactMethodsCardProps {
  kind: ContactMethodKind;
  label: string;
  value: string;
  /** tel:/mailto: link — omit for values that aren't actionable */
  href?: string;
}

const ICON_PATHS: Record<ContactMethodKind, string[]> = {
  phone: [
    "M6.5 3.5h3l1.5 4-2 1.5a12.5 12.5 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z",
  ],
  email: ["M3.5 5.5h17v13h-17z", "m3.5 7.5 8.5 6 8.5-6"],
  fax: [
    "M7 8V3.5h10V8",
    "M7 8H5a2 2 0 0 0-2 2v6h4",
    "M17 8h2a2 2 0 0 1 2 2v6h-4",
    "M7 13.5h10v7H7z",
  ],
  address: [
    "M12 21s-7-5.75-7-11a7 7 0 0 1 14 0c0 5.25-7 11-7 11Z",
    "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  ],
};

/**
 * One contact method card: a stroke icon that draws itself in on scroll
 * (GSAP dash animation, DrawLine-style), the value set in display type and
 * a copy-to-clipboard button whose icon morphs into a checkmark with an
 * aria-live "Copied" confirmation.
 */
export default function ContactMethodsCard({
  kind,
  label,
  value,
  href,
}: ContactMethodsCardProps) {
  const { reduced } = useReducedMotionPref();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  // Self-drawing icon (stroke-dash scrub is the one sanctioned exception to
  // transform/opacity — mirrors the DrawLine primitive).
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) return;
    const shapes = Array.from(
      svg.querySelectorAll<SVGGeometryElement>("path, circle, line, polyline, rect"),
    );
    if (shapes.length === 0) return;

    const ctx = gsap.context(() => {
      shapes.forEach((shape) => {
        const length = shape.getTotalLength();
        gsap.set(shape, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.to(shapes, {
        strokeDashoffset: 0,
        duration: DUR.slow,
        ease: EASE.inOut,
        stagger: 0.12,
        scrollTrigger: { trigger: svg, start: TRIGGER.start, once: true },
      });
    }, svg);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — fail silently.
    }
  };

  const valueClass =
    "mt-2 block break-words font-display text-[length:var(--text-h3)] font-semibold leading-snug text-plaster";

  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-card border border-white/10 bg-ink-soft p-6">
      <div className="flex items-start justify-between gap-4">
        <svg
          ref={svgRef}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-8 w-8 shrink-0 text-gold-bright"
        >
          {ICON_PATHS[kind].map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>

        <span className="flex items-center gap-2.5">
          <span
            aria-live="polite"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-bright"
          >
            {copied ? "Copied" : ""}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label.toLowerCase()} to clipboard`}
            className="relative h-9 w-9 shrink-0 rounded-pill border border-white/15 text-plaster/70 transition-colors duration-300 hover:border-gold-bright hover:text-gold-bright"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: reduced ? 0.1 : 0.2 }}
                  className="absolute inset-0 grid place-items-center text-gold-bright"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m4.5 12.5 5 5 10-11" />
                  </svg>
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: reduced ? 0.1 : 0.2 }}
                  className="absolute inset-0 grid place-items-center"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="9" y="9" width="11" height="11" rx="1.5" />
                    <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </span>
      </div>

      <div>
        <p className="kicker">{label}</p>
        {href ? (
          <a
            href={href}
            className={`${valueClass} transition-colors duration-300 hover:text-gold-bright`}
          >
            {value}
          </a>
        ) : (
          <p className={valueClass}>{value}</p>
        )}
      </div>
    </div>
  );
}
