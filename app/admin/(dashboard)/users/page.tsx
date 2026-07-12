"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Role } from "@/lib/content/types";
import { adminGet, adminSend } from "@/components/admin/api";
import { Badge, Button, PageHeader, useToast } from "@/components/admin/ui";
import { TextField } from "@/components/admin/fields";

function CodeBlock({ children, label }: { children: string; label: string }) {
  const { toast } = useToast();
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-input border border-white/10 bg-ink px-4 py-3 pr-20 text-xs leading-relaxed text-plaster/90">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            toast(`${label} copied to clipboard.`, "success");
          } catch {
            toast("Could not copy — select and copy manually.", "error");
          }
        }}
        className="absolute right-2 top-2 rounded-input border border-white/20 px-2 py-1 text-[11px] font-semibold text-plaster/80 transition-colors hover:border-white/40 hover:text-plaster"
      >
        Copy
      </button>
    </div>
  );
}

export default function UsersPage() {
  const { toast } = useToast();
  const { data: me } = useQuery({
    queryKey: ["whoami"],
    queryFn: () => adminGet<{ email: string; role: Role }>("whoami"),
  });

  const [password, setPassword] = useState("");
  const [hash, setHash] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: (pw: string) =>
      adminSend<{ hash: string }>("users/hash", "POST", { password: pw }),
    onSuccess: (data) => {
      setHash(data.hash);
      setPassword("");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const isOwner = me?.role === "owner";

  return (
    <>
      <PageHeader
        title="Users"
        description="Admin accounts are configured through environment variables — no database, no signup."
      />

      <div className="space-y-6">
        {/* Current session */}
        <section className="rounded-card border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Signed in
          </h2>
          {me ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm text-ink">{me.email}</p>
              <Badge tone={me.role === "owner" ? "gold" : "neutral"}>{me.role}</Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone">Loading session…</p>
          )}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-input border border-ink/10 bg-plaster p-3">
              <dt className="font-semibold text-ink">Owner</dt>
              <dd className="mt-1 text-stone">
                Full access — settings, users, raw embeds. Configured via{" "}
                <code className="text-ink/70">ADMIN_EMAIL</code> +{" "}
                <code className="text-ink/70">ADMIN_PASSWORD_HASH</code>.
              </dd>
            </div>
            <div className="rounded-input border border-ink/10 bg-plaster p-3">
              <dt className="font-semibold text-ink">Editors</dt>
              <dd className="mt-1 text-stone">
                Content editing only. Configured via{" "}
                <code className="text-ink/70">ADMIN_EDITORS</code> (comma-separated{" "}
                <code className="text-ink/70">email:hash</code> pairs).
              </dd>
            </div>
          </dl>
        </section>

        {/* How it works */}
        <section className="rounded-card border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Adding or changing users
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
            <li>Generate a password hash below (owner only).</li>
            <li>
              Set the environment variables in Vercel (Project → Settings →
              Environment Variables) or your local <code className="text-ink/70">.env.local</code>.
            </li>
            <li>Redeploy (or restart the dev server) for changes to apply.</li>
          </ol>
          <div className="mt-4">
            <CodeBlock label="Env example">{`ADMIN_EMAIL="owner@characom.example.com"
ADMIN_PASSWORD_HASH="scrypt:<salt>:<hash>"
# Optional editors (comma-separated email:hash pairs)
ADMIN_EDITORS="editor@characom.example.com:scrypt:<salt>:<hash>"`}</CodeBlock>
          </div>
          <p className="mt-3 text-xs text-stone">
            Password hashes are one-way (scrypt) — the plain password is never
            stored. The full user list lives only in the environment and is
            not readable from the browser.
          </p>
        </section>

        {/* Hash generator (owner only) */}
        <section className="rounded-card border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Password hash generator
          </h2>
          {!isOwner ? (
            <p className="mt-3 text-sm text-stone">
              Only the owner account can generate password hashes. Ask the site
              owner to create credentials for you.
            </p>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (password.length >= 8) generate.mutate(password);
                }}
                className="mt-4 flex flex-wrap items-end gap-3"
              >
                <div className="min-w-[16rem] flex-1">
                  <TextField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={setPassword}
                    help="At least 8 characters. Sent once over HTTPS, hashed server-side, never stored."
                    error={
                      password.length > 0 && password.length < 8
                        ? "Password must be at least 8 characters."
                        : undefined
                    }
                  />
                </div>
                <Button
                  type="submit"
                  loading={generate.isPending}
                  disabled={password.length < 8}
                  className="mb-[1px]"
                >
                  Generate hash
                </Button>
              </form>

              {hash && (
                <div className="mt-5 space-y-3" aria-live="polite">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
                    Generated hash
                  </p>
                  <CodeBlock label="Hash">{hash}</CodeBlock>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
                    Ready-to-paste env lines
                  </p>
                  <CodeBlock label="Env snippet">{`# Owner:
ADMIN_PASSWORD_HASH="${hash}"
# …or as an editor entry:
ADMIN_EDITORS="editor@characom.example.com:${hash}"`}</CodeBlock>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
