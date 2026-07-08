"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";
import { Button } from "@/components/admin/ui";
import { DUR } from "@/lib/motion/constants";

/** Only allow same-site relative redirect targets (no open redirects). */
function safeNext(raw: string | null): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reduced } = useReducedMotionPref();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        /* empty body */
      }
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Sign-in failed. Please try again.";
        setError(message);
        setAttempt((n) => n + 1);
        return;
      }
      const next = safeNext(searchParams.get("next"));
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again.");
      setAttempt((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-input border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-plaster placeholder:text-stone/70 transition-[box-shadow,border-color] duration-150 focus:border-white/25 focus:shadow-[inset_0_-2px_0_0_var(--gold)]";

  return (
    <main className="on-dark flex min-h-screen items-center justify-center bg-plaster px-4">
      <motion.div
        key={attempt}
        animate={
          attempt > 0 && !reduced
            ? { x: [0, -10, 10, -6, 6, 0] }
            : { x: 0 }
        }
        transition={{ duration: DUR.fast, ease: "easeOut" }}
        className="gold-mesh w-full max-w-sm rounded-card p-8 shadow-2xl glow-accent"
      >
        <div className="mb-8">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-[0.14em] text-plaster">
              CHARACOM
            </span>
            <span className="rounded-pill border border-gold/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-bright">
              Admin
            </span>
          </p>
          <p className="mt-2 text-sm text-stone">
            Sign in to manage the Characom Group website.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-stone"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-stone"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div aria-live="assertive">
            {error && (
              <p className="rounded-input border border-red-400/40 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={!email || !password}
          >
            Sign in
          </Button>
        </form>

        {process.env.NODE_ENV === "development" && (
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-stone">
            Dev fallback (no ADMIN_PASSWORD_HASH set):{" "}
            <code className="text-plaster/80">admin@characom.dev</code> /{" "}
            <code className="text-plaster/80">characom</code>
          </p>
        )}
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
