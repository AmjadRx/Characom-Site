"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  /** index to open at; null = closed */
  openIndex: number | null;
  onClose: () => void;
}

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

/**
 * Accessible gallery lightbox (CONTRACTS.md — components/ui).
 * Portal-rendered dialog: focus trap, Esc closes, arrow keys navigate,
 * Framer fade+scale, "3 / 12" counter and captions. Body scroll is locked
 * while open; focus is restored to the trigger on close.
 */
export default function Lightbox({ images, openIndex, onClose }: LightboxProps) {
  const { reduced } = useReducedMotionPref();
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const open = openIndex !== null && images.length > 0;
  const count = images.length;
  const safeIndex = count > 0 ? Math.min(Math.max(index, 0), count - 1) : 0;
  const current = images[safeIndex];

  useEffect(() => setMounted(true), []);

  // Sync internal index whenever the lightbox is (re)opened at a position.
  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  const next = useCallback(
    () => setIndex((i) => (count ? (i + 1) % count : 0)),
    [count],
  );
  const prev = useCallback(
    () => setIndex((i) => (count ? (i - 1 + count) % count : 0)),
    [count],
  );

  // Keyboard: Esc / arrows / Tab-trap.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex >= 0);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose, next, prev]);

  // Scroll lock (native + Lenis).
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [open]);

  if (!mounted) return null;

  const fade = reduced ? 0.15 : DUR.fast;

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Image gallery, ${safeIndex + 1} of ${count}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fade, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95"
        >
          {/* backdrop click closes */}
          <button
            type="button"
            aria-label="Close gallery"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            tabIndex={-1}
          />

          {/* counter */}
          <p className="absolute left-5 top-5 z-10 select-none text-sm font-medium tracking-[0.14em] text-plaster/70 tabular-nums">
            {safeIndex + 1} / {count}
          </p>

          {/* close */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-pill border border-white/15 text-plaster transition-colors duration-300 hover:border-gold-bright hover:text-gold-bright"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* image + caption */}
          <div className="relative z-[5] flex max-h-[86vh] w-[min(92vw,1400px)] flex-col items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={safeIndex}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.975 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
                transition={{ duration: fade, ease: EASE_OUT }}
                className="flex w-full flex-col items-center"
              >
                <div className="relative h-[min(74vh,900px)] w-full">
                  <Image
                    src={current.src}
                    alt={current.alt}
                    fill
                    sizes="92vw"
                    className="object-contain"
                    priority
                  />
                </div>
                {current.caption ? (
                  <figcaption className="mt-4 max-w-2xl text-center text-sm text-plaster/70">
                    {current.caption}
                  </figcaption>
                ) : null}
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* prev / next */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label={`Previous image (${((safeIndex - 1 + count) % count) + 1} of ${count})`}
                className={cn(
                  "absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-pill",
                  "border border-white/15 text-plaster transition-colors duration-300 hover:border-gold-bright hover:text-gold-bright md:left-6",
                )}
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
                onClick={next}
                aria-label={`Next image (${((safeIndex + 1) % count) + 1} of ${count})`}
                className={cn(
                  "absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-pill",
                  "border border-white/15 text-plaster transition-colors duration-300 hover:border-gold-bright hover:text-gold-bright md:right-6",
                )}
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
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export { Lightbox };
