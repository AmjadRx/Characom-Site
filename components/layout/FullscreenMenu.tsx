"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import type { NavigationItem, SiteSettings } from "@/lib/content/types";
import { DUR, EASE_FM, STAGGER } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import NavLink from "./NavLink";

const EASE_IN_OUT: [number, number, number, number] = [...EASE_FM.inOut];
const EASE_OUT_HARD: [number, number, number, number] = [...EASE_FM.outHard];

export interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  /** header navigation items (one nesting level) */
  nav: NavigationItem[];
  settings: SiteSettings;
  /** optional social links (NavigationData.social) */
  social?: NavigationItem[];
}

function byOrder(a: NavigationItem, b: NavigationItem) {
  return a.sortOrder - b.sortOrder;
}

/**
 * Full-viewport ink overlay menu (ARCHITECTURE §3.4 / §4.1).
 * y-wipe in/out via AnimatePresence, oversized staggered link reveals,
 * offices + phones + socials rail, focus trap + Esc + scroll lock.
 * Rendered by SiteHeader; closes on route change (header effect) and on
 * every link click.
 */
export default function FullscreenMenu({
  open,
  onClose,
  nav,
  settings,
  social = [],
}: FullscreenMenuProps) {
  const { reduced } = useReducedMotionPref();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Scroll lock — a `menu-open` body class (styling/coordination hook),
     Lenis's own stop class on <html>, plus a plain overflow lock for native
     scrolling. The overlay itself scrolls via data-lenis-prevent. */
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    document.body.classList.add("menu-open");
    html.classList.add("lenis-stopped");
    html.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("menu-open");
      html.classList.remove("lenis-stopped");
      html.style.overflow = prevOverflow;
    };
  }, [open]);

  /* Focus trap + Esc. Focus moves to the close button on open and returns
     to the invoking element (the hamburger) on close. */
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  const items = [...nav].sort(byOrder);
  const offices = settings.contact.offices;
  const phones = settings.contact.phones;
  const emails = settings.contact.emails;
  const socials = [...social].sort(byOrder);

  const linkVariants: Variants = reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { y: "110%" },
        visible: {
          y: "0%",
          transition: { duration: DUR.base, ease: EASE_OUT_HARD },
        },
      };

  const railDelay = reduced ? 0 : DUR.pageTransition * 0.9;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          id="fullscreen-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          data-lenis-prevent=""
          className="on-dark gold-mesh fixed inset-0 z-[70] overflow-y-auto text-plaster"
          initial={reduced ? { opacity: 0 } : { y: "-100%" }}
          animate={reduced ? { opacity: 1 } : { y: "0%" }}
          exit={reduced ? { opacity: 0 } : { y: "-100%" }}
          transition={{
            duration: reduced ? 0.2 : DUR.pageTransition,
            ease: EASE_IN_OUT,
          }}
        >
          {/* Top bar: wordmark echo + close */}
          <div className="container-site flex h-[var(--nav-h-scrolled)] items-center justify-between">
            <span
              aria-hidden="true"
              className="font-display text-lg font-semibold tracking-[-0.02em]"
            >
              {settings.branding.logoText}
              <span className="text-gold-bright">.</span>
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="group relative flex h-11 w-11 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className="absolute block h-[1.5px] w-6 rotate-45 bg-current transition-transform duration-300 group-hover:rotate-[135deg]"
              />
              <span
                aria-hidden="true"
                className="absolute block h-[1.5px] w-6 -rotate-45 bg-current transition-transform duration-300 group-hover:-rotate-[135deg]"
              />
            </button>
          </div>

          <div className="container-site flex min-h-[calc(100%-var(--nav-h-scrolled))] flex-col justify-between gap-16 pt-8 pb-10 lg:pt-14">
            {/* Oversized staggered links */}
            <nav aria-label="Fullscreen navigation">
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: reduced ? 0 : STAGGER.lines,
                      delayChildren: reduced ? 0 : DUR.pageTransition * 0.5,
                    },
                  },
                }}
                className="flex flex-col gap-1"
              >
                {items.map((item, index) => (
                  <li key={item.id} className="overflow-hidden py-1">
                    <motion.div variants={linkVariants}>
                      <NavLink
                        item={item}
                        onClick={onClose}
                        className="group inline-flex items-baseline gap-4 font-display text-[clamp(2.2rem,5.5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-plaster transition-colors duration-300 hover:text-gold-bright focus-visible:text-gold-bright"
                      >
                        <span
                          aria-hidden="true"
                          className="text-[0.8125rem] font-body font-semibold tracking-[0.18em] text-gold-bright/80 tabular-nums"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {item.label}
                      </NavLink>
                      {item.children && item.children.length > 0 && (
                        <ul className="mt-1 mb-3 flex flex-wrap gap-x-7 gap-y-1 pl-11">
                          {[...item.children].sort(byOrder).map((child) => (
                            <li key={child.id}>
                              <NavLink
                                item={child}
                                onClick={onClose}
                                className="link-underline text-sm text-plaster/60 transition-colors duration-300 hover:text-plaster focus-visible:text-plaster"
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  </li>
                ))}
              </motion.ul>
            </nav>

            {/* Rail: offices + contact + socials */}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.2 : DUR.base,
                delay: railDelay,
                ease: EASE_OUT_HARD,
              }}
              className="grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3"
            >
              <div>
                <span className="kicker kicker--accent mb-5 block">
                  Offices
                </span>
                <ul className="space-y-5">
                  {offices.length === 0 && (
                    <li className="text-sm text-plaster/50">
                      {settings.siteName}, Cyprus
                    </li>
                  )}
                  {offices.map((office) => (
                    <li key={office.name}>
                      <p className="font-medium">{office.name}</p>
                      <p className="text-sm leading-relaxed text-plaster/55">
                        {office.address}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="kicker kicker--accent mb-5 block">
                  Contact
                </span>
                <ul className="space-y-2">
                  {phones.map((phone) => (
                    <li key={phone}>
                      <a
                        href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                        onClick={onClose}
                        className="link-underline text-sm text-plaster/70 transition-colors duration-300 hover:text-plaster"
                      >
                        {phone}
                      </a>
                    </li>
                  ))}
                  {emails.map((email) => (
                    <li key={email}>
                      <a
                        href={`mailto:${email}`}
                        onClick={onClose}
                        className="link-underline text-sm text-plaster/70 transition-colors duration-300 hover:text-plaster"
                      >
                        {email}
                      </a>
                    </li>
                  ))}
                  {settings.contact.fax && (
                    <li className="text-sm text-plaster/50">
                      Fax {settings.contact.fax}
                    </li>
                  )}
                  <li className="pt-3">
                    <a
                      href="/admin"
                      onClick={onClose}
                      className="link-underline text-sm font-medium text-gold-bright"
                    >
                      Admin panel
                    </a>
                  </li>
                </ul>
              </div>

              {socials.length > 0 && (
                <div>
                  <span className="kicker kicker--accent mb-5 block">
                    Follow
                  </span>
                  <ul className="space-y-2">
                    {socials.map((s) => (
                      <li key={s.id}>
                        <NavLink
                          item={s}
                          onClick={onClose}
                          className="link-underline inline-flex items-center gap-1.5 text-sm text-plaster/70 transition-colors duration-300 hover:text-plaster"
                        >
                          {s.label}
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3"
                          >
                            <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
                          </svg>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
