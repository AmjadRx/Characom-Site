"use client";

import { useRef, useState } from "react";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { DUR, EASE_FM, STAGGER } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { Reveal } from "@/components/motion";
import { formatDate } from "@/lib/utils";

export interface NewsListRow {
  slug: string;
  title: string;
  publishedAt: string;
  tag: string;
  coverImage: string;
  coverImageAlt: string;
}

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];
const PREVIEW_HEIGHT = 180; // px, matches w-60 at 4:3

/**
 * News rows with a hover thumbnail that softly follows the cursor's
 * y-position (spring-smoothed). Preview is desktop-only, aria-hidden and
 * disabled under reduced motion — rows remain plain accessible links.
 */
export default function NewsListRows({ rows }: { rows: NewsListRow[] }) {
  const { reduced } = useReducedMotionPref();
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rawY = useMotionValue(0);
  const y = useSpring(rawY, { stiffness: 150, damping: 22, mass: 0.4 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const target = e.clientY - rect.top - PREVIEW_HEIGHT / 2;
    rawY.set(Math.min(Math.max(target, 0), Math.max(rect.height - PREVIEW_HEIGHT, 0)));
  };

  const showPreview = !reduced && hovered !== null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={reduced ? undefined : onMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <ul className="border-b border-ink/10">
        {rows.map((row, i) => (
          <Reveal
            as="li"
            key={row.slug}
            delay={Math.min(i, 6) * STAGGER.listRows}
          >
            <Link
              href={`/news/${row.slug}`}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className="group grid grid-cols-1 gap-1 border-t border-ink/10 py-6 md:grid-cols-[9rem_1fr_auto] md:items-baseline md:gap-6"
            >
              <time
                dateTime={row.publishedAt}
                className="text-sm text-stone tabular-nums"
              >
                {formatDate(row.publishedAt)}
              </time>
              <h3 className="font-display text-[length:var(--text-h3)] font-semibold leading-tight text-ink transition-transform duration-500 group-hover:translate-x-2">
                {row.title}
              </h3>
              <span className="mt-1 flex items-center gap-4 md:mt-0">
                {row.tag ? (
                  <span className="rounded-pill border border-ink/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-stone">
                    {row.tag}
                  </span>
                ) : null}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-ink/40 transition-transform duration-500 group-hover:translate-x-1.5 group-hover:text-gold-deep"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>

      {/* Floating thumbnail preview — decorative, desktop only */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-[6%] top-0 z-20 hidden w-60 overflow-hidden rounded-card shadow-2xl lg:block"
          style={{ y }}
          initial={false}
          animate={{
            opacity: showPreview ? 1 : 0,
            scale: showPreview ? 1 : 0.94,
            rotate: showPreview ? -1.5 : 0,
          }}
          transition={{ duration: DUR.fast, ease: EASE_OUT }}
        >
          <div className="relative aspect-[4/3] bg-ink-soft">
            {rows.map((row, i) =>
              row.coverImage ? (
                <Image
                  key={row.slug}
                  src={row.coverImage}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover transition-opacity duration-300"
                  style={{ opacity: hovered === i ? 1 : 0 }}
                />
              ) : null,
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
