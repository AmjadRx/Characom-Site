"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotionPref } from "./ReducedMotionProvider";

/**
 * Route transitions (ARCHITECTURE.md §3.4 / §6.1): an ink panel wipes up over
 * the outgoing page, a gold accent line sweeps along its leading edge, then
 * the panel continues up to reveal the new page whose content rises in.
 * Total ≈ DUR.pageTransition (700ms). Under reduced motion this collapses to
 * a simple crossfade.
 *
 * Critically, all ScrollTrigger instances are killed and refreshed on every
 * route change — stale triggers are the #1 source of scroll bugs.
 */

const HALF = DUR.pageTransition / 2; // cover 350ms → reveal 350ms

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
                  // Content starts rising while the panel is still clearing.
                  delay: HALF * 0.5,
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
            {/* Reveal panel: starts covering the fresh page, wipes up away. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[95] bg-ink"
              initial={{ y: "0%" }}
              animate={{
                y: "-101%",
                transition: { duration: HALF, ease: EASE_FM.inOut, delay: 0.05 },
              }}
              exit={{ y: "-101%" }}
            >
              {/* Gold sweep line on the trailing (bottom) edge. */}
              <motion.span
                className="absolute inset-x-0 bottom-0 block h-0.5 origin-left bg-gold"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: 1,
                  transition: { duration: HALF * 0.9, ease: EASE_FM.out },
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
