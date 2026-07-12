/**
 * Single source of truth for motion timing (ARCHITECTURE.md §9).
 * Every animated component pulls durations/eases/staggers from here so the
 * whole site's timing feels authored, not accidental.
 */

export const DUR = {
  /** micro interactions: hovers, taps */
  fast: 0.3,
  /** standard reveals */
  base: 0.6,
  /** headline reveals, big surfaces */
  slow: 1.1,
  /** page transition total (600–800ms per spec) */
  pageTransition: 0.7,
  /** preloader hard cap */
  preloaderMax: 2.5,
} as const;

/** GSAP ease strings */
export const EASE = {
  out: "power3.out",
  outHard: "power4.out",
  inOut: "power3.inOut",
  expo: "expo.out",
} as const;

/** Framer Motion cubic-bezier equivalents */
export const EASE_FM = {
  out: [0.215, 0.61, 0.355, 1] as const,
  outHard: [0.16, 1, 0.3, 1] as const,
  inOut: [0.645, 0.045, 0.355, 1] as const,
};

export const STAGGER = {
  lines: 0.08,
  cards: 0.1,
  listRows: 0.06,
} as const;

/** ScrollTrigger defaults */
export const TRIGGER = {
  /** standard reveal trigger point */
  start: "top 75%",
  /** counters fire a bit later */
  counterStart: "top 60%",
} as const;

/** Shared spring for magnetic / tilt interactions */
export const SPRING = {
  stiffness: 300,
  damping: 25,
  mass: 0.6,
} as const;

/** Magnetic pull range in px (desktop only) */
export const MAGNETIC_RANGE = 8;

/** TiltCard max tilt in degrees */
export const TILT_MAX = 6;
