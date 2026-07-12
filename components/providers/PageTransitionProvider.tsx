"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotionPref } from "./ReducedMotionProvider";

/**
 * Route transitions (ARCHITECTURE.md §3.4 / §6.1, amended 2026-07-12): an ink
 * panel wipes up over the outgoing page; while it covers the incoming page a
 * percentage counts up (the same luxury load-counter language as the
 * Preloader); the panel then continues up to reveal the new page whose
 * content rises in. Under reduced motion this collapses to a crossfade.
 *
 * Critically, all ScrollTrigger instances are killed and refreshed on every
 * route change — stale triggers are the #1 source of scroll bugs.
 */

const HALF = DUR.pageTransition / 2; // cover 350ms → reveal 350ms
/** covered hold while the route counter runs */
const COUNT_S = 0.45;

/** rAF-driven 0→100 on the covering panel — direct DOM writes, no re-render */
function RouteCounter() {
  const numberRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const startAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startAt) / (COUNT_S * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      if (numberRef.current) {
        numberRef.current.textContent = String(Math.round(eased * 100));
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="absolute bottom-[4vh] left-[var(--gutter)] block font-display font-medium leading-none text-plaster">
      <span ref={numberRef} className="text-[clamp(4rem,13vw,9rem)] tracking-[-0.02em]">
        0
      </span>
      <span className="ml-1.5 align-top text-[clamp(1.25rem,2.5vw,1.75rem)] text-gold-bright">
        %
      </span>
    </span>
  );
}

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { reduced } = useReducedMotionPref();

  const handleExitComplete = useCallback(() => {
    // Old page is gone (mode="wait") and the new one has not mounted yet —
    // the safe moment to clear every remaining trigger, then re-measure.
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
      <motion.div key={pathname} className="relative">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: reduced
              ? { duration: DUR.fast * 0.66, ease: EASE_FM.out }
              : {
                  duration: HALF,
                  // Content starts rising as the panel clears, after the count.
                  delay: COUNT_S + HALF * 0.5,
                  ease: EASE_FM.out,
                },
          }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: DUR.fast * 0.66, ease: EASE_FM.out } }
              : // Keep the old page fully visible while the ink panel covers
                // it; this exit tween only paces AnimatePresence.
                { opacity: 1, transition: { duration: HALF } }
          }
        >
          {children}
        </motion.div>

        {!reduced && (
          <>
            {/* Reveal panel: covers the fresh page, runs the load counter,
                then wipes up away. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[95] bg-ink"
              initial={{ y: "0%" }}
              animate={{
                y: "-101%",
                transition: {
                  duration: HALF,
                  ease: EASE_FM.inOut,
                  delay: COUNT_S,
                },
              }}
              exit={{ y: "-101%" }}
            >
              <RouteCounter />
              {/* Gold sweep line on the trailing (bottom) edge. */}
              <motion.span
                className="absolute inset-x-0 bottom-0 block h-0.5 origin-left bg-gold"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: 1,
                  transition: { duration: COUNT_S + HALF * 0.6, ease: EASE_FM.out },
                }}
              />
            </motion.div>

            {/* Cover panel: wipes up from the bottom over the outgoing page. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[95] bg-ink"
              initial={{ y: "101%" }}
              animate={{ y: "101%" }}
              exit={{
                y: "0%",
                transition: { duration: HALF, ease: EASE_FM.inOut },
              }}
            >
              {/* Gold line on the leading (top) edge as the panel rises. */}
              <span className="absolute inset-x-0 top-0 block h-0.5 bg-gold" />
            </motion.div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
