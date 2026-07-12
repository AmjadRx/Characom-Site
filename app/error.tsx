"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MorphButton } from "@/components/motion";

/**
 * Branded root error boundary. Self-contained (no providers) — a calm ink
 * panel with a retry action. Digest shown small for support reference.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="on-dark gold-mesh relative flex min-h-screen items-center overflow-hidden bg-ink text-plaster">
      <style>{`
        @keyframes err-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        .err-rise { animation: err-rise 0.8s var(--ease-out-expo) both; }
        .err-rise-2 { animation: err-rise 0.8s var(--ease-out-expo) 0.12s both; }
        @media (prefers-reduced-motion: reduce) {
          .err-rise, .err-rise-2 { animation: none; }
        }
      `}</style>
      <div className="container-site py-24">
        <p className="kicker kicker--accent err-rise">Something went wrong</p>
        <h1 className="text-display-2 err-rise mt-6 max-w-2xl text-plaster">
          We hit an unexpected obstacle.
        </h1>
        <p className="err-rise-2 mt-6 max-w-md text-plaster/70">
          An error occurred while loading this page. Please try again — if it
          keeps happening, we would appreciate hearing about it.
        </p>
        <div className="err-rise-2 mt-10 flex flex-wrap items-center gap-6">
          <MorphButton label="Try again" onClick={reset} variant="gold" dark />
          <Link
            href="/"
            className="link-underline font-medium text-plaster"
          >
            Back to home
          </Link>
        </div>
        {error.digest ? (
          <p className="err-rise-2 mt-10 text-xs text-plaster/40">
            Error reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
