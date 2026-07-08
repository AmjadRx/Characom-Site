"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type {
  AuditEntry,
  Inquiry,
  NewsPost,
  Project,
} from "@/lib/content/types";
import { adminGet } from "@/components/admin/api";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import type { BadgeTone } from "@/components/admin/ui";

interface PageIndexEntry {
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ACTION_TONE: Record<AuditEntry["action"], BadgeTone> = {
  create: "green",
  update: "neutral",
  delete: "red",
  publish: "gold",
};

function StatCard({
  label,
  value,
  href,
  accent = false,
}: {
  label: string;
  value: number | undefined;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-ink/10 bg-white p-5 transition-colors hover:border-gold/50"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </p>
      <p
        className={
          "mt-2 font-display text-4xl font-semibold tabular-nums " +
          (accent ? "text-gold-deep" : "text-ink")
        }
      >
        {value ?? "—"}
      </p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const inquiries = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => adminGet<Inquiry[]>("inquiries"),
  });
  const pages = useQuery({
    queryKey: ["pages"],
    queryFn: () => adminGet<PageIndexEntry[]>("pages"),
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => adminGet<Project[]>("projects"),
  });
  const news = useQuery({
    queryKey: ["news"],
    queryFn: () => adminGet<NewsPost[]>("news"),
  });
  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: () => adminGet<AuditEntry[]>("audit"),
  });

  const newInquiries = inquiries.data?.filter((i) => i.status === "new").length;
  const recentAudit = (audit.data ?? []).slice(0, 8);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything on the live site is editable from here — changes publish in seconds, no deploy."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="New inquiries"
          value={newInquiries}
          href="/admin/inquiries"
          accent={(newInquiries ?? 0) > 0}
        />
        <StatCard label="Pages" value={pages.data?.length} href="/admin/pages" />
        <StatCard
          label="Projects"
          value={projects.data?.length}
          href="/admin/projects"
        />
        <StatCard label="News posts" value={news.data?.length} href="/admin/news" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Recent activity */}
        <section aria-labelledby="dash-activity">
          <h2
            id="dash-activity"
            className="mb-3 font-display text-lg font-semibold text-ink"
          >
            Recent activity
          </h2>
          {audit.isLoading ? (
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-card bg-ink/5" />
              ))}
            </div>
          ) : recentAudit.length === 0 ? (
            <EmptyState
              title="No activity yet"
              text="Edits made in the admin will show up here."
            />
          ) : (
            <ul className="divide-y divide-ink/5 rounded-card border border-ink/10 bg-white">
              {recentAudit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm"
                >
                  <Badge tone={ACTION_TONE[entry.action] ?? "neutral"}>
                    {entry.action}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-ink">
                    <span className="font-medium">{entry.entity}</span>
                    {entry.entityId && entry.entityId !== entry.entity && (
                      <span className="text-stone"> · {entry.entityId}</span>
                    )}
                  </span>
                  <span className="truncate text-xs text-stone" title={entry.actor}>
                    {entry.actor}
                  </span>
                  <span className="text-xs tabular-nums text-stone">
                    {timeAgo(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-right">
            <Link
              href="/admin/audit"
              className="link-underline text-xs font-medium text-ink/70"
            >
              Full audit log
            </Link>
          </p>
        </section>

        <div className="space-y-6">
          {/* Quick actions */}
          <section aria-labelledby="dash-actions">
            <h2
              id="dash-actions"
              className="mb-3 font-display text-lg font-semibold text-ink"
            >
              Quick actions
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/pages"
                className="rounded-card border border-ink/10 bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                New page
                <span className="mt-0.5 block text-xs font-normal text-stone">
                  Compose a page from blocks and publish it live.
                </span>
              </Link>
              <Link
                href="/admin/projects"
                className="rounded-card border border-ink/10 bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                New project
                <span className="mt-0.5 block text-xs font-normal text-stone">
                  Add a case study with gallery and specs.
                </span>
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-card border border-ink/10 bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                View site
                <span className="mt-0.5 block text-xs font-normal text-stone">
                  Open the public website in a new tab.
                </span>
              </a>
            </div>
          </section>

          {/* Content source status */}
          <section
            aria-labelledby="dash-source"
            className="rounded-card border border-ink/10 bg-white p-4"
          >
            <h2
              id="dash-source"
              className="mb-1 font-display text-sm font-semibold text-ink"
            >
              Content source
            </h2>
            <p className="flex items-center gap-2 text-sm text-ink">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-gold" />
              {process.env.NODE_ENV === "development"
                ? "Local files (development)"
                : "GitHub repository"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone">
              In production, edits are saved as commits to GitHub and go live
              within seconds. Saving requires the{" "}
              <code className="text-ink/70">GITHUB_TOKEN</code>,{" "}
              <code className="text-ink/70">GITHUB_REPO</code> and{" "}
              <code className="text-ink/70">GITHUB_BRANCH</code> environment
              variables on Vercel — without them the CMS is read-only and saves
              will fail with an explanatory message.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
