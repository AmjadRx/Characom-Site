"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { NavigationItem, SiteSettings } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { DUR, EASE, EASE_FM } from "@/lib/motion/constants";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotionPref } from "@/components/providers";
import FullscreenMenu from "./FullscreenMenu";
import NavLink from "./NavLink";

const SCROLL_THRESHOLD = 80;
const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

export interface SiteHeaderProps {
  nav: NavigationItem[];
  settings: SiteSettings;
  /** optional social links, forwarded to the fullscreen menu rail */
  social?: NavigationItem[];
}

function byOrder(a: NavigationItem, b: NavigationItem) {
  return a.sortOrder - b.sortOrder;
}

/**
 * Fixed site header (ARCHITECTURE §3.4).
 * - transparent over the hero; after 80px becomes a 70%-opacity
 *   backdrop-blur(12px) bar, height 96 → 64px, logo scales to .85
 * - adapts light/dark to the section underneath via [data-nav-theme="dark"]
 * - 2px gold scroll-progress bar along the bottom edge (GSAP-smoothed)
 * - up to 6 top-level links w/ animated underline, one dropdown level
 * - hamburger opens the FullscreenMenu
 *
 * SSR renders the deterministic initial state (not scrolled, dark hero
 * assumed); scroll-derived state is corrected on mount, and transitions are
 * suppressed until mounted to avoid a first-paint flicker.
 */
export default function SiteHeader({ nav, settings, social }: SiteHeaderProps) {
  const pathname = usePathname();
  const { reduced } = useReducedMotionPref();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);

  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  /* Close menu + dropdowns on route change. */
  useEffect(() => {
    setMenuOpen(false);
    setDropdown(null);
  }, [pathname]);

  /* Scroll state + light/dark adaptation. A single rAF-throttled handler
     probes which section sits under the header via [data-nav-theme="dark"]. */
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const isScrolled = y > SCROLL_THRESHOLD;
      setScrolled(isScrolled);

      const probeY = (isScrolled ? 64 : 96) / 2;
      let dark = false;
      const sections = document.querySelectorAll<HTMLElement>(
        '[data-nav-theme="dark"]',
      );
      for (let i = 0; i < sections.length; i += 1) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) {
          dark = true;
          break;
        }
      }
      setOverDark(dark);
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    // Re-probe after page transitions settle content in.
    const t1 = window.setTimeout(update, 300);
    const t2 = window.setTimeout(update, DUR.pageTransition * 1000 + 200);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  /* 2px gold scroll-progress bar, scrubbed against body scroll. GSAP
     smooths the scaleX; under reduced motion the value is set directly. */
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;

    const progress = () => {
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      return Math.min(window.scrollY / max, 1);
    };

    if (reduced) {
      const onScroll = () => {
        el.style.transform = `scaleX(${progress()})`;
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    gsap.set(el, { scaleX: progress() });
    const quick = gsap.quickTo(el, "scaleX", {
      duration: DUR.fast,
      ease: EASE.out,
    });
    const onScroll = () => quick(progress());
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      gsap.killTweensOf(el);
    };
  }, [reduced, pathname]);

  const items = [...nav].sort(byOrder).slice(0, 6);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const tone = overDark ? "text-plaster" : "text-ink";
  const barBg = scrolled
    ? overDark
      ? "bg-ink/70 backdrop-blur-[12px]"
      : "bg-plaster/70 backdrop-blur-[12px]"
    : "bg-transparent";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          tone,
          barBg,
          overDark && "on-dark",
          mounted
            ? "transition-[height,background-color,color,backdrop-filter] duration-[var(--dur-base)] [transition-timing-function:var(--ease-out-expo)]"
            : "transition-none",
        )}
        style={{
          height: scrolled ? "var(--nav-h-scrolled)" : "var(--nav-h)",
        }}
      >
        <div className="container-site flex h-full items-center justify-between gap-8">
          {/* Wordmark / logo */}
          <Link
            href="/"
            aria-label={`${settings.siteName} — home`}
            className="relative z-10 shrink-0"
          >
            <span
              className={cn(
                "block origin-left",
                mounted &&
                  "transition-transform duration-[var(--dur-base)] [transition-timing-function:var(--ease-out-expo)]",
                scrolled && "scale-[0.85]",
              )}
            >
              {settings.branding.logoImage ? (
                <Image
                  src={settings.branding.logoImage}
                  alt={settings.branding.logoText || settings.siteName}
                  width={180}
                  height={44}
                  priority
                  className="h-9 w-auto"
                />
              ) : (
                <span className="font-display text-[1.375rem] font-semibold tracking-[-0.02em]">
                  {settings.branding.logoText}
                  <span
                    className={overDark ? "text-gold-bright" : "text-gold-deep"}
                  >
                    .
                  </span>
                </span>
              )}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {items.map((item) => {
                const children = item.children ?? [];
                const hasChildren = children.length > 0;
                const active = isActive(item.href);
                const open = dropdown === item.id;
                return (
                  <li
                    key={item.id}
                    className="relative"
                    onMouseEnter={
                      hasChildren ? () => setDropdown(item.id) : undefined
                    }
                    onMouseLeave={
                      hasChildren
                        ? () =>
                            setDropdown((current) =>
                              current === item.id ? null : current,
                            )
                        : undefined
                    }
                    onFocus={
                      hasChildren ? () => setDropdown(item.id) : undefined
                    }
                    onBlur={
                      hasChildren
                        ? (event: ReactFocusEvent<HTMLLIElement>) => {
                            if (
                              !event.currentTarget.contains(
                                event.relatedTarget as Node | null,
                              )
                            ) {
                              setDropdown((current) =>
                                current === item.id ? null : current,
                              );
                            }
                          }
                        : undefined
                    }
                    onKeyDown={
                      hasChildren
                        ? (event: ReactKeyboardEvent<HTMLLIElement>) => {
                            if (event.key === "Escape") setDropdown(null);
                          }
                        : undefined
                    }
                  >
                    <NavLink
                      item={item}
                      aria-current={active ? "page" : undefined}
                      aria-haspopup={hasChildren ? "true" : undefined}
                      aria-expanded={hasChildren ? open : undefined}
                      className={cn(
                        "group relative inline-flex items-center gap-1.5 py-2 text-[0.9rem] font-medium tracking-[0.01em] transition-opacity duration-300",
                        active ? "opacity-100" : "opacity-75 hover:opacity-100",
                      )}
                    >
                      {item.label}
                      {hasChildren && (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "h-3 w-3 transition-transform duration-300",
                            open && "rotate-180",
                          )}
                        >
                          <path d="M3.5 6l4.5 4.5L12.5 6" />
                        </svg>
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-[450ms] [transition-timing-function:var(--ease-out-expo)] group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100",
                          overDark ? "bg-gold-bright" : "bg-gold-deep",
                          active && "origin-left scale-x-100",
                        )}
                      />
                    </NavLink>

                    {hasChildren && (
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: reduced ? 0 : 8 }}
                            transition={{ duration: DUR.fast, ease: EASE_OUT }}
                            className="absolute left-0 top-full w-max pt-3"
                          >
                            <ul className="on-dark min-w-52 rounded-card border border-white/10 bg-ink-soft/95 py-2.5 shadow-2xl backdrop-blur-md">
                              {[...children].sort(byOrder).map((child) => (
                                <li key={child.id}>
                                  <NavLink
                                    item={child}
                                    aria-current={
                                      isActive(child.href) ? "page" : undefined
                                    }
                                    className={cn(
                                      "block px-5 py-2 text-sm transition-colors duration-200 hover:text-gold-bright focus-visible:text-gold-bright",
                                      isActive(child.href)
                                        ? "text-gold-bright"
                                        : "text-plaster/75",
                                    )}
                                  />
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Hamburger — animated 2-line icon */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="fullscreen-menu"
            className="group relative z-10 inline-flex h-11 items-center gap-3"
          >
            <span
              className="hidden text-[0.8125rem] font-semibold uppercase tracking-[0.18em] opacity-75 transition-opacity duration-300 group-hover:opacity-100 sm:block"
              aria-hidden="true"
            >
              Menu
            </span>
            <span
              aria-hidden="true"
              className="flex w-6 flex-col items-end gap-[7px]"
            >
              <span className="h-[1.5px] w-6 bg-current transition-transform duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-[2px]" />
              <span className="h-[1.5px] w-4 origin-right bg-current transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:w-6 group-hover:translate-y-[2px]" />
            </span>
          </button>
        </div>

        {/* 2px gold scroll progress bar */}
        <div
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gold"
        />
      </header>

      <FullscreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        nav={nav}
        settings={settings}
        social={social}
      />
    </>
  );
}
