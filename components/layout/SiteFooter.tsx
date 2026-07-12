import Link from "next/link";
import type { NavigationData, NavigationItem, SiteSettings } from "@/lib/content/types";
import { Parallax } from "@/components/motion";
import NavLink from "./NavLink";
import { BackToTop, MotionToggle } from "./FooterClient";

export interface SiteFooterProps {
  nav: NavigationData;
  settings: SiteSettings;
}

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Cookie Policy", href: "/legal/cookies" },
  { label: "Admin", href: "/admin" },
];

function byOrder(a: NavigationItem, b: NavigationItem) {
  return a.sortOrder - b.sortOrder;
}

/**
 * Site footer (ARCHITECTURE §5.1.9) — server component with small client
 * islands (BackToTop, MotionToggle, Parallax watermark).
 * 4 columns: three nav columns (titles from nav.footerColumnTitles) +
 * Offices from settings; socials under the brand block; legal row;
 * giant outline watermark at 4% opacity, slightly parallaxed.
 */
export default function SiteFooter({ nav, settings }: SiteFooterProps) {
  const titles = nav.footerColumnTitles ?? {
    footer_1: "Sectors",
    footer_2: "Company",
    footer_3: "Resources",
  };
  const columns = [
    { key: "footer_1", title: titles.footer_1, items: [...(nav.footer_1 ?? [])].sort(byOrder) },
    { key: "footer_2", title: titles.footer_2, items: [...(nav.footer_2 ?? [])].sort(byOrder) },
    { key: "footer_3", title: titles.footer_3, items: [...(nav.footer_3 ?? [])].sort(byOrder) },
  ];
  const socials = [...(nav.social ?? [])].sort(byOrder);
  const offices = settings.contact.offices;
  const year = new Date().getFullYear();

  return (
    <footer
      className="section-dark on-dark relative overflow-hidden"
      data-nav-theme="dark"
    >
      {/* Giant outline watermark — 4% opacity, slight parallax */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-0.12em] select-none"
      >
        <Parallax speed={0.92} className="flex justify-center">
          <span
            className="whitespace-nowrap font-display text-[clamp(5rem,21vw,21rem)] font-bold leading-none tracking-[-0.04em]"
            style={{
              WebkitTextStroke: "1.5px rgba(247, 245, 240, 0.9)",
              color: "transparent",
              opacity: 0.04,
            }}
          >
            {settings.branding.logoText}
          </span>
        </Parallax>
      </div>

      <div className="container-site section-pad">
        {/* Brand row */}
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-md">
            <Link
              href="/"
              aria-label={`${settings.siteName} — home`}
              className="inline-block font-display text-2xl font-semibold tracking-[-0.02em]"
            >
              {settings.branding.logoText}
              <span className="text-gold-bright">.</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-plaster/55">
              {settings.tagline}
            </p>
            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {socials.map((s) => (
                  <li key={s.id}>
                    <NavLink
                      item={s}
                      className="link-underline inline-flex items-center gap-1.5 text-sm text-plaster/70 transition-colors duration-300 hover:text-gold-bright"
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
            )}
          </div>
          <BackToTop />
        </div>

        {/* 4 columns: 3 nav columns + offices */}
        <nav
          aria-label="Footer"
          className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {columns.map((column) => (
            <div key={column.key}>
              <h2 className="kicker kicker--accent mb-5">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      item={item}
                      className="link-underline text-sm text-plaster/70 transition-colors duration-300 hover:text-plaster"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="kicker kicker--accent mb-5">Offices</h2>
            <ul className="space-y-5">
              {offices.length === 0 && (
                <li className="text-sm text-plaster/50">
                  {settings.siteName}, Cyprus
                </li>
              )}
              {offices.map((office) => (
                <li key={office.name}>
                  <p className="text-sm font-medium text-plaster">
                    {office.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-plaster/55">
                    {office.address}
                  </p>
                  {office.phone && (
                    <a
                      href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}
                      className="link-underline mt-1 inline-block text-sm text-plaster/70 transition-colors duration-300 hover:text-gold-bright"
                    >
                      {office.phone}
                    </a>
                  )}
                  {office.hours && (
                    <p className="mt-1 text-xs text-plaster/40">
                      {office.hours}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Legal row */}
        <div className="mt-20 flex flex-col gap-5 border-t border-white/10 pt-8 text-sm text-plaster/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings.siteName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-underline transition-colors duration-300 hover:text-plaster"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <MotionToggle />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
