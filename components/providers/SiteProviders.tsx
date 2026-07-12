"use client";

import { ReducedMotionProvider } from "./ReducedMotionProvider";
import { SmoothScrollProvider } from "./SmoothScrollProvider";
import { PageTransitionProvider } from "./PageTransitionProvider";
import { CursorProvider } from "./CursorProvider";

/**
 * Composes the global motion providers in the mandated order
 * (ARCHITECTURE.md §6.1). Used once in app/(site)/layout.tsx — and in the
 * hidden /dev/motion playground, which lives outside the (site) group.
 */
export function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReducedMotionProvider>
      <SmoothScrollProvider>
        <PageTransitionProvider>
          <CursorProvider>{children}</CursorProvider>
        </PageTransitionProvider>
      </SmoothScrollProvider>
    </ReducedMotionProvider>
  );
}
