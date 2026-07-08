"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { MorphButton } from "@/components/motion";
import { useReducedMotionPref } from "@/components/providers";

const STORAGE_KEY = "characom-cookie-consent";
const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

type Consent = "accepted" | "declined";

/**
 * GDPR cookie consent (ARCHITECTURE §5.6.7) — owned by pages.
 * Non-blocking bottom-left ink card: role="dialog" without aria-modal or a
 * focus trap, so the page stays fully usable. Choice persists to
 * localStorage ("characom-cookie-consent"); the banner never reappears once
 * answered. Slides up via Framer (simple fade under reduced motion).
 */
export default function CookieBanner() {
  const { reduced } = useReducedMotionPref();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // storage unavailable (private mode) — don't nag on every visit
    }
  }, []);

  const choose = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // best effort — still dismiss for this session
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="on-dark glow-accent fixed bottom-4 left-4 right-4 z-[60] max-w-[26rem] rounded-card border border-white/10 bg-ink p-6 text-plaster sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <h2 className="font-display text-base font-semibold">
            Cookies, plainly
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-plaster/70">
            We use a small number of cookies to understand how the site is
            used and to improve it. Read more in our{" "}
            <Link
              href="/legal/cookies"
              className="link-underline font-medium text-gold-bright"
            >
              cookie policy
            </Link>
            .
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <MorphButton
              label="Accept"
              variant="gold"
              dark
              onClick={() => choose("accepted")}
            />
            <MorphButton
              label="Decline"
              variant="ghost"
              dark
              onClick={() => choose("declined")}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
