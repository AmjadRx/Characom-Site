import Link from "next/link";
import { MorphButton } from "@/components/motion";

/**
 * Branded 404 (ARCHITECTURE §12 Phase 7). Lives outside the (site) group:
 * no providers, no header/footer — a self-contained ink panel with a gentle
 * CSS rise-in (disabled under reduced motion via the global kill-switch).
 */
export default function NotFound() {
  return (
    <main className="on-dark gold-mesh relative flex min-h-screen items-center overflow-hidden bg-ink text-plaster">
      <style>{`
        @keyframes nf-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        .nf-rise { animation: nf-rise 0.8s var(--ease-out-expo) both; }
        .nf-rise-2 { animation: nf-rise 0.8s var(--ease-out-expo) 0.12s both; }
        .nf-rise-3 { animation: nf-rise 0.8s var(--ease-out-expo) 0.24s both; }
        @media (prefers-reduced-motion: reduce) {
          .nf-rise, .nf-rise-2, .nf-rise-3 { animation: none; }
        }
      `}</style>
      <div className="container-site py-24">
        <p className="kicker kicker--accent nf-rise">Page not found</p>
        <h1 className="text-display-1 nf-rise-2 mt-6 text-plaster">
          4<span className="text-gold">0</span>4
        </h1>
        <p className="nf-rise-3 mt-6 max-w-md text-plaster/70">
          The page you are looking for has moved, been unpublished, or never
          existed. Let us take you back to solid ground.
        </p>
        <div className="nf-rise-3 mt-10 flex flex-wrap items-center gap-6">
          <MorphButton label="Back to home" href="/" variant="gold" dark />
          <Link
            href="/portfolio"
            className="link-underline font-medium text-plaster"
          >
            Explore our work
          </Link>
        </div>
      </div>
    </main>
  );
}
