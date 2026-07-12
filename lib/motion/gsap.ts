"use client";

/**
 * Single client-only entry point for GSAP (CONTRACTS.md — "Import GSAP ONLY
 * via lib/motion/gsap.ts"). ScrollTrigger is registered exactly once here;
 * every scroll-linked component imports { gsap, ScrollTrigger } from this
 * module so plugin registration can never be duplicated or forgotten.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
