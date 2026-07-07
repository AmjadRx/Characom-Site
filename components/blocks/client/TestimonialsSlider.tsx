"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
}

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];
const AUTO_ADVANCE_MS = 7000;

/**
 * Elegant quote carousel: swipe/drag on x, auto-advance every 7s with
 * pause-on-hover/focus, dots + prev/next controls. aria-roledescription
 * carousel/slide semantics; the live region only announces while paused so
 * auto-rotation never spams screen readers. Reduced motion: no auto-advance,
 * 150ms crossfades, drag disabled.
 */
export default function TestimonialsSlider({
  items,
}: {
  items: TestimonialItem[];
}) {
  const { reduced } = useReducedMotionPref();
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const paginate = useCallback(
    (dir: number) => {
      setState(([i]) => [(((i + dir) % count) + count) % count, dir]);
    },
    [count],
  );

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const timer = window.setInterval(() => paginate(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
    // `index` in deps restarts the timer after manual navigation.
  }, [reduced, paused, count, paginate, index]);

  const item = items[index] ?? items[0];
  if (!item) return null;

  const variants = {
    enter: (dir: number) => ({ x: reduced ? 0 : dir * 90, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: reduced ? 0 : dir * -90, opacity: 0 }),
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        aria-live={paused || reduced ? "polite" : "off"}
        className="relative min-h-[16rem] overflow-hidden sm:min-h-[14rem]"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.figure
            key={index}
            custom={direction}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: reduced ? 0.15 : DUR.base,
              ease: EASE_OUT,
            }}
            drag={reduced || count < 2 ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -64) paginate(1);
              else if (info.offset.x > 64) paginate(-1);
            }}
            className={cn(count > 1 && !reduced && "cursor-grab active:cursor-grabbing")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-9 w-9 text-gold-deep"
            >
              <path d="M4.5 13.5c0-4.1 2.6-7.2 6.2-8.5l.8 1.6c-2.3 1-3.9 2.9-4.2 4.9.3-.1.7-.2 1.1-.2 1.9 0 3.3 1.4 3.3 3.3 0 2-1.5 3.4-3.5 3.4-2.2 0-3.7-1.8-3.7-4.5Zm9.6 0c0-4.1 2.6-7.2 6.2-8.5l.8 1.6c-2.3 1-3.9 2.9-4.2 4.9.3-.1.7-.2 1.1-.2 1.9 0 3.3 1.4 3.3 3.3 0 2-1.5 3.4-3.5 3.4-2.2 0-3.7-1.8-3.7-4.5Z" />
            </svg>
            <blockquote className="mt-6 max-w-3xl font-display text-[length:var(--text-h3)] font-medium leading-snug text-ink">
              {item.quote}
            </blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-semibold text-ink">{item.author}</span>
              {item.role ? (
                <span className="text-stone"> — {item.role}</span>
              ) : null}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to testimonial ${i + 1} of ${count}`}
                aria-current={i === index}
                onClick={() => setState([i, i > index ? 1 : -1])}
                className={cn(
                  "h-2.5 w-2.5 rounded-pill border transition-colors duration-300",
                  i === index
                    ? "border-gold-deep bg-gold-deep"
                    : "border-ink/30 hover:bg-ink/20",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous testimonial"
              className="grid h-11 w-11 place-items-center rounded-pill border border-ink/20 text-ink/70 transition-colors duration-300 hover:border-ink/50 hover:text-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next testimonial"
              className="grid h-11 w-11 place-items-center rounded-pill border border-ink/20 text-ink/70 transition-colors duration-300 hover:border-ink/50 hover:text-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
