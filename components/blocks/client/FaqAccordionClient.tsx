"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Accessible accordion (CONTRACTS.md — faq): each question is a
 * button[aria-expanded][aria-controls] inside a heading; the answer panel
 * opens/closes via Framer AnimatePresence height animation with a rotating
 * chevron. Framer owns the element (lifecycle animation — no GSAP here).
 * Reduced motion: instant toggle.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function FaqAccordionClient({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const uid = useId();
  const { reduced } = useReducedMotionPref();

  const toggle = (index: number) =>
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index],
    );

  return (
    <div className={cn("divide-y divide-ink/10 border-y border-ink/10", className)}>
      {items.map((item, i) => {
        const open = openItems.includes(i);
        const buttonId = `${uid}-q-${i}`;
        const panelId = `${uid}-a-${i}`;
        return (
          <div key={i}>
            <h3 className="m-0 text-base leading-normal font-normal">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="font-display flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium md:py-6 md:text-xl"
              >
                <span>{item.question}</span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{
                    duration: reduced ? 0 : DUR.fast,
                    ease: [...EASE_FM.out],
                  }}
                  className="shrink-0 text-gold-deep"
                >
                  <ChevronIcon className="size-5" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduced ? 0.01 : DUR.fast + 0.15,
                    ease: [...EASE_FM.inOut],
                  }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[62ch] pr-10 pb-6 leading-relaxed text-ink/70">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
