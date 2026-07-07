"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Global reduced-motion switch (ARCHITECTURE.md §6.4).
 * Combines the OS `prefers-reduced-motion` media query with a persisted user
 * toggle (localStorage "characom-motion", surfaced in the site footer).
 * The effective value is mirrored to `<html data-reduced-motion="true">` so
 * the CSS kill-switch in globals.css stays in sync with the JS one.
 */

const STORAGE_KEY = "characom-motion";
const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

/** User override: null = follow the system preference. */
type MotionOverride = "reduced" | "full" | null;

export interface ReducedMotionContextValue {
  reduced: boolean;
  toggle: () => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
  reduced: false,
  toggle: () => {},
});

function readStoredOverride(): MotionOverride {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "reduced" || value === "full" ? value : null;
  } catch {
    return null;
  }
}

export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR-safe defaults: render as "full motion" on the server; the real
  // preference is resolved on mount, before any scroll-triggered animation
  // can meaningfully run. The CSS media-query kill-switch covers first paint.
  const [systemReduced, setSystemReduced] = useState(false);
  const [override, setOverride] = useState<MotionOverride>(null);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA_QUERY);
    const sync = () => setSystemReduced(mq.matches);
    sync();
    setOverride(readStoredOverride());
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const reduced = override !== null ? override === "reduced" : systemReduced;

  // Mirror to <html> for the CSS global switch + third-party styling hooks.
  useEffect(() => {
    const root = document.documentElement;
    if (reduced) root.setAttribute("data-reduced-motion", "true");
    else root.removeAttribute("data-reduced-motion");
  }, [reduced]);

  const toggle = useCallback(() => {
    const next: MotionOverride = reduced ? "full" : "reduced";
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode) — toggle still works for session.
    }
  }, [reduced]);

  const value = useMemo(() => ({ reduced, toggle }), [reduced, toggle]);

  return (
    <ReducedMotionContext.Provider value={value}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

/**
 * Every animated component must consult this before animating and render its
 * final state when `reduced` is true (ARCHITECTURE.md §6.4).
 */
export function useReducedMotionPref(): ReducedMotionContextValue {
  return useContext(ReducedMotionContext);
}
