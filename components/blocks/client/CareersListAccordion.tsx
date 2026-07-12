"use client";

import { useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_FM, STAGGER } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { MorphButton, Reveal } from "@/components/motion";

export interface CareersListItem {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  /** server-rendered RichText description */
  content: React.ReactNode;
}

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

/**
 * Accessible accordion of open roles. One panel open at a time; buttons
 * carry aria-expanded/aria-controls and panels are labelled regions.
 * Height animation collapses to a 150ms step under reduced motion.
 */
export default function CareersListAccordion({
  items,
}: {
  items: CareersListItem[];
}) {
  const { reduced } = useReducedMotionPref();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="border-b border-ink/10">
      {items.map((item, i) => {
        const isOpen = openId === item.id;
        const headerId = `career-header-${item.id}`;
        const panelId = `career-panel-${item.id}`;
        return (
          <Reveal
            as="li"
            key={item.id}
            delay={Math.min(i, 5) * STAGGER.listRows}
          >
            <div className="border-t border-ink/10">
              <h3>
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-[length:var(--text-h3)] font-semibold leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep">
                      {item.title}
                    </span>
                    <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-stone">
                      {item.department ? (
                        <span className="rounded-pill border border-ink/15 px-3 py-0.5 text-xs font-medium uppercase tracking-[0.12em]">
                          {item.department}
                        </span>
                      ) : null}
                      {item.location ? <span>{item.location}</span> : null}
                      {item.location && item.type ? (
                        <span aria-hidden="true">·</span>
                      ) : null}
                      {item.type ? <span>{item.type}</span> : null}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className={cn(
                      "h-6 w-6 shrink-0 text-ink/50 transition-transform duration-300 group-hover:text-gold-deep",
                      isOpen && "rotate-45",
                    )}
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="panel"
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      reduced
                        ? { duration: 0.15 }
                        : { duration: 0.45, ease: EASE_OUT }
                    }
                    className="overflow-hidden"
                  >
                    <div className="max-w-3xl pb-9 pr-4">
                      {item.content}
                      <div className="mt-7">
                        <MorphButton
                          label="Apply for this role"
                          href="/contact?subject=careers"
                          variant="gold"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </ul>
  );
}
