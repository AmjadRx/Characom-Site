"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Role } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { adminGet, adminSend } from "./api";
import { Badge } from "./ui/Badge";

/* ── Icons (inline, stroke 1.5, currentColor) ──────────────────────────── */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icon({ d, boxes }: { d: string; boxes?: { x: number; y: number; w: number; h: number; r?: number }[] }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true" className="shrink-0">
      {boxes?.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r ?? 1.5} />
      ))}
      <path d={d} />
    </svg>
  );
}

/* ── Nav model ─────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <Icon d="" boxes={[{ x: 3.5, y: 3.5, w: 7, h: 7 }, { x: 13.5, y: 3.5, w: 7, h: 7 }, { x: 3.5, y: 13.5, w: 7, h: 7 }, { x: 13.5, y: 13.5, w: 7, h: 7 }]} />,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        label: "Pages",
        href: "/admin/pages",
        icon: <Icon d="M14 3.5v5h5M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5l-4.5-5Z" />,
      },
      {
        label: "Projects",
        href: "/admin/projects",
        icon: <Icon d="M4 20.5h16M6 20.5V6l6-2.5V20.5M18 20.5V10l-6-2M9 8.5h.01M9 12h.01M9 15.5h.01M15 12.5h.01M15 15.5h.01" />,
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: <Icon d="M3.5 7.5v-2A1.5 1.5 0 0 1 5 4h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z" />,
      },
      {
        label: "News",
        href: "/admin/news",
        icon: <Icon d="M17.5 8.5h3v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13h14ZM7 9h7M7 12.5h7M7 16h4" />,
      },
      {
        label: "Careers",
        href: "/admin/careers",
        icon: <Icon d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5c2.7 1.3 5.6 2 8.5 2s5.8-.7 8.5-2" boxes={[{ x: 3.5, y: 7, w: 17, h: 12.5, r: 2 }]} />,
      },
      {
        label: "Media",
        href: "/admin/media",
        icon: <Icon d="M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 18.5l5.5-5.5 3 3 3.5-3.5 4 4" boxes={[{ x: 3.5, y: 4.5, w: 17, h: 15, r: 2 }]} />,
      },
      {
        label: "Navigation",
        href: "/admin/navigation",
        icon: <Icon d="M4 6.5h16M4 12h10M4 17.5h13" />,
      },
    ],
  },
  {
    title: "Inbox",
    items: [
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        icon: <Icon d="M3.5 13h5l1.5 2.5h4L15.5 13h5M3.5 13V7A1.5 1.5 0 0 1 5 5.5h14A1.5 1.5 0 0 1 20.5 7v6M3.5 13v4.5A1.5 1.5 0 0 0 5 19h14a1.5 1.5 0 0 0 1.5-1.5V13" />,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.1-1.3L14.5 3h-5l-.5 2.6a7.5 7.5 0 0 0-2.1 1.3l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2.1 1.3l.5 2.6h5l.5-2.6a7.5 7.5 0 0 0 2.1-1.3l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />,
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: <Icon d="M15.5 20v-1.5a3.5 3.5 0 0 0-3.5-3.5H6.5A3.5 3.5 0 0 0 3 18.5V20M9.25 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM21 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.4 4.2a3.75 3.75 0 0 1 0 7.1" />,
      },
      {
        label: "Audit log",
        href: "/admin/audit",
        icon: <Icon d="M12 7.5V12l3 2M12 21a9 9 0 1 0-9-9c0 2.5 1 4.7 2.6 6.3L3.5 21H8" />,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

/* ── Shell ─────────────────────────────────────────────────────────────── */

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-input px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/10 font-semibold text-gold-bright"
                        : "text-plaster/75 hover:bg-white/5 hover:text-plaster",
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {active && (
                      <span aria-hidden="true" className="ml-auto h-1 w-1 rounded-pill bg-gold" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ShellFooter({ me }: { me?: { email: string; role: Role } }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminSend<{ ok: boolean }>("auth/logout", "POST");
    } catch {
      // Cookie clearing failed server-side — still send them to login.
    } finally {
      window.location.assign("/admin/login");
    }
  }

  // Inlined at build: dev = local filesystem, deployed = GitHub Contents API.
  const sourceLabel =
    process.env.NODE_ENV === "development" ? "Local files" : "GitHub";

  return (
    <div className="space-y-3 border-t border-white/10 px-5 py-4">
      <div className="flex items-center gap-2 text-xs text-stone">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-gold" />
        <span>
          Content source: <span className="text-plaster/80">{sourceLabel}</span>
        </span>
      </div>
      {me && (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-plaster/80" title={me.email}>
            {me.email}
          </p>
          <Badge tone={me.role === "owner" ? "gold" : "neutral"}>{me.role}</Badge>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline inline-flex items-center gap-1.5 text-xs text-plaster/80 hover:text-plaster"
        >
          View site
          <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="inline-flex items-center gap-1.5 rounded-input border border-white/15 px-2.5 py-1.5 text-xs text-plaster/80 transition-colors hover:border-white/30 hover:text-plaster disabled:opacity-50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M15 16.5V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 15 5v2.5M10 12h11m0 0-3-3m3 3-3 3" />
          </svg>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2 px-5 py-5">
      <span className="font-display text-base font-bold tracking-[0.14em] text-plaster">
        CHARACOM
      </span>
      <span className="rounded-pill border border-gold/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-bright">
        Admin
      </span>
    </Link>
  );
}

/**
 * Admin console frame: ink sidebar (desktop) / top bar with slide-down panel
 * (mobile), plaster main region. No site providers — plain scrolling.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["whoami"],
    queryFn: () => adminGet<{ email: string; role: Role }>("whoami"),
    staleTime: 5 * 60_000,
  });

  // Close the mobile panel on route change + Esc.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-plaster text-ink lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only z-[110] rounded-input bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="on-dark hidden bg-ink lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Wordmark />
        <NavLinks pathname={pathname} />
        <ShellFooter me={me} />
      </aside>

      {/* Mobile top bar + panel */}
      <div className="on-dark bg-ink lg:hidden">
        <div className="flex items-center justify-between pr-3">
          <Wordmark />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-input p-2 text-plaster transition-colors hover:bg-white/10"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <div id="admin-mobile-nav" className="flex flex-col border-t border-white/10">
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <ShellFooter me={me} />
          </div>
        )}
      </div>

      {/* Main region */}
      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
