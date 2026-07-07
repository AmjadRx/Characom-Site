"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ProjectStatus, ThemeColor } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { TiltCard } from "@/components/motion";
import FilterPills from "@/components/ui/FilterPills";

export interface ProjectGridItem {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  location: string;
  year: number;
  status: ProjectStatus;
  coverImage: string;
  coverImageAlt: string;
}

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "in_progress" },
];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
};

function GridSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-pill border border-ink/20 bg-transparent py-1.5 pl-4 pr-9 text-sm font-medium text-ink/80 transition-colors duration-300 hover:border-ink/45 hover:text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/60"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/**
 * §5.3 client grid: sticky filter bar (status pills + year/location selects)
 * over a Framer layout-FLIP grid of TiltCards — cards glide to new positions
 * on filter change, exits fade and shrink.
 */
export default function ProjectGridClient({
  items,
  showFilters,
  theme,
}: {
  items: ProjectGridItem[];
  showFilters: boolean;
  theme: ThemeColor;
}) {
  const { reduced } = useReducedMotionPref();
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [location, setLocation] = useState("all");

  const years = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.year)))
        .sort((a, b) => b - a)
        .map((y) => ({ label: String(y), value: String(y) })),
    [items],
  );
  const locations = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.location).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((l) => ({ label: l, value: l })),
    [items],
  );

  const filtered = items.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (year === "all" || String(item.year) === year) &&
      (location === "all" || item.location === location),
  );

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-stone">
        Projects are on their way — check back soon.
      </p>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="sticky top-[calc(var(--nav-h-scrolled)+0.75rem)] z-30 mb-12">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-ink/10 bg-plaster/85 px-4 py-3 backdrop-blur-md">
            <FilterPills
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              theme={theme}
              label="Filter by project status"
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <GridSelect
                label="Filter by year"
                value={year}
                onChange={setYear}
                options={[{ label: "All years", value: "all" }, ...years]}
              />
              <GridSelect
                label="Filter by location"
                value={location}
                onChange={setLocation}
                options={[
                  { label: "All locations", value: "all" },
                  ...locations,
                ]}
              />
            </div>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "project" : "projects"} shown
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-stone">
          No projects match those filters.
        </p>
      ) : (
        <motion.ul
          layout={!reduced}
          className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((item) => (
              <motion.li
                key={item.id}
                layout={!reduced}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                transition={{
                  duration: reduced ? 0.15 : DUR.fast,
                  ease: EASE_OUT,
                  layout: { duration: DUR.base, ease: EASE_OUT },
                }}
              >
                <TiltCard theme={theme} className="h-full">
                  <Link
                    href={`/portfolio/${item.categorySlug}/${item.slug}`}
                    data-cursor="view"
                    data-cursor-label="View"
                    className="group block h-full"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink/5">
                      <Image
                        src={item.coverImage}
                        alt={item.coverImageAlt}
                        fill
                        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 92vw"
                        className="object-cover"
                      />
                      <span className="absolute right-3 top-3 rounded-pill bg-ink/70 px-3 py-1 text-xs font-medium text-plaster tabular-nums backdrop-blur-sm">
                        {item.year}
                      </span>
                    </div>
                    <div className="pt-4">
                      <h3 className="font-display text-lg font-semibold leading-tight text-ink">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-stone">
                        {item.location}
                        <span aria-hidden="true"> · </span>
                        <span
                          className={cn(
                            item.status === "in_progress" && "text-gold-deep",
                          )}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </p>
                    </div>
                  </Link>
                </TiltCard>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
