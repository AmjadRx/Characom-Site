"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { ScrollTrigger } from "@/lib/motion/gsap";
import {
  DEFAULT_LOADER_IMAGES,
  loaderImageSrc,
  pickLoaderImage,
} from "@/lib/loader-images";
import { useReducedMotionPref } from "./ReducedMotionProvider";

/**
 * Route transitions, deterministic single-overlay design (rewrite,
 * 2026-07-12). The previous dual-panel AnimatePresence choreography raced on
 * some navigations and left a covering panel stuck at y:0 ("sector pages
 * stuck in the loading screen").
 *
 * How it works now — one persistent overlay, one explicit state machine:
 *  1. A capture-phase click listener intercepts internal link clicks,
 *     prevents default, and plays the COVER phase: the overlay (construction
 *     photo + counting %) wipes up over the old page. The page content is
 *     never unmounted — no exit animations to get stuck on.
 *  2. router.push() fires behind the covered screen; when the new pathname
 *     commits, ScrollTriggers are killed, the scroll position resets, and
 *     triggers re-measure.
 *  3. The overlay then wipes away (REVEAL) — a hard 3s watchdog guarantees
 *     it can never stay stuck, even if the route errors.
 * Under reduced motion navigation is native (no interception, no overlay).
 * Back/forward (popstate) skips the cover and just plays a quick reveal.
 */

const COVER_S = DUR.pageTransition / 2; // wipe up over old page
const COUNT_S = 0.45; // covered hold while the % counts
const REVEAL_S = DUR.pageTransition / 2; // wipe away
/** absolute ceiling between cover start and forced reveal */
const WATCHDOG_MS = 3000;

type OverlayPhase = "idle" | "covering" | "covered" | "revealing";

function isInternalNavClick(
  event: MouseEvent,
): { href: string } | null {
  if (event.defaultPrevented) return null;
  if (event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return null;
  const target = event.target as Element | null;
  const anchor = target?.closest?.("a");
  if (!anchor) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // Admin is a separate app shell — let it load natively.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api"))
    return null;
  const current = window.location;
  if (url.pathname === current.pathname && url.search === current.search) {
    // Same page (maybe a hash) — let the browser/Lenis handle it.
    return null;
  }
  return { href: url.pathname + url.search + url.hash };
}

/** rAF-driven 0→100 — direct DOM writes, no re-render per frame */
function RouteCounter() {
  const numberRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const startAt = performance.now();
    const total = (COVER_S + COUNT_S) * 1000;
    const tick = (now: number) => {
      const t = Math.min((now - startAt) / total, 1);
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
      <span
        ref={numberRef}
        className="text-[clamp(4rem,13vw,9rem)] tracking-[-0.02em]"
      >
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
  loaderImages = [],
}: {
  children: React.ReactNode;
  /** construction photos shown on the covering overlay (from site settings) */
  loaderImages?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { reduced } = useReducedMotionPref();

  const [phase, setPhase] = useState<OverlayPhase>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pendingPath = useRef<string | null>(null);
  const watchdog = useRef<number>(0);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const imagesRef = useRef(loaderImages);
  imagesRef.current = loaderImages;

  const clearWatchdog = () => {
    if (watchdog.current) {
      window.clearTimeout(watchdog.current);
      watchdog.current = 0;
    }
  };

  /* Intercept internal link clicks → play the cover phase, then navigate. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (reducedRef.current) return; // native navigation under reduced motion
      if (phaseRef.current !== "idle") {
        // Mid-transition: swallow extra clicks (the overlay is covering).
        const nav = isInternalNavClick(event);
        if (nav) event.preventDefault();
        return;
      }
      const nav = isInternalNavClick(event);
      if (!nav) return;
      event.preventDefault();

      setPhoto(loaderImageSrc(pickLoaderImage(imagesRef.current, nav.href)));
      setPhase("covering");
      pendingPath.current = nav.href;

      // Navigate once the cover wipe has fully hidden the old page.
      window.setTimeout(() => {
        router.push(nav.href);
      }, COVER_S * 1000);

      // Absolute guarantee: never stay covered longer than the watchdog.
      clearWatchdog();
      watchdog.current = window.setTimeout(() => {
        setPhase((p) => (p === "idle" ? p : "revealing"));
      }, WATCHDOG_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* Pathname committed: clean scroll state; reveal if we were covering.
     Only triggers whose DOM was unmounted by the route change are killed —
     killing ALL triggers would destroy live ones created during this very
     mount (the pinned scenes) and persistent ones (footer parallax). */
  const firstPathRun = useRef(true);
  useEffect(() => {
    if (firstPathRun.current) {
      firstPathRun.current = false;
      return;
    }
    ScrollTrigger.getAll().forEach((trigger) => {
      const el = trigger.trigger as Element | null;
      if (el && !el.isConnected) trigger.kill();
    });
    window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());

    if (phaseRef.current === "covering" || phaseRef.current === "covered") {
      // Give the counter its covered beat, then wipe away.
      const hold = window.setTimeout(
        () => setPhase("revealing"),
        COUNT_S * 1000,
      );
      return () => window.clearTimeout(hold);
    }
  }, [pathname]);

  /* Warm the loader-photo pool after first paint. */
  useEffect(() => {
    const warm = () => {
      const pool =
        imagesRef.current.length > 0 ? imagesRef.current : DEFAULT_LOADER_IMAGES;
      for (const src of pool) {
        const img = new Image();
        img.decoding = "async";
        img.src = loaderImageSrc(src);
      }
    };
    const timer = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCoverComplete = useCallback(() => {
    setPhase((p) => (p === "covering" ? "covered" : p));
  }, []);

  const handleRevealComplete = useCallback(() => {
    clearWatchdog();
    pendingPath.current = null;
    setPhase("idle");
    setPhoto(null);
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            key="route-overlay"
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[95] overflow-hidden bg-ink"
            initial={{ y: "101%" }}
            animate={{
              y: phase === "revealing" ? "-101%" : "0%",
              transition: {
                duration: phase === "revealing" ? REVEAL_S : COVER_S,
                ease: EASE_FM.inOut,
              },
            }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            onAnimationComplete={() => {
              if (phaseRef.current === "covering") handleCoverComplete();
              else if (phaseRef.current === "revealing") handleRevealComplete();
            }}
          >
            {photo ? (
              <motion.img
                src={photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 1.08 }}
                animate={{
                  scale: 1,
                  transition: {
                    duration: COVER_S + COUNT_S + REVEAL_S,
                    ease: [...EASE_FM.out],
                  },
                }}
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgb(10 10 13 / 0.9) 0%, rgb(10 10 13 / 0.5) 45%, rgb(10 10 13 / 0.3) 100%)",
              }}
            />
            <RouteCounter />
            {/* Gold hairline on the leading edge */}
            <span className="absolute inset-x-0 top-0 block h-0.5 bg-gold" />
            <motion.span
              className="absolute inset-x-0 bottom-0 block h-0.5 origin-left bg-gold"
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: 1,
                transition: {
                  duration: COVER_S + COUNT_S,
                  ease: EASE_FM.out,
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
