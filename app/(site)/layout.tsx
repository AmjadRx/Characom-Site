import type { Metadata } from "next";
import { getNavigation, getSettings } from "@/lib/content";
import { organizationJsonLd } from "@/lib/seo";
import { SiteProviders } from "@/components/providers";
import { Preloader, SiteFooter, SiteHeader } from "@/components/layout";
import CookieBanner from "@/components/layout/CookieBanner";

/**
 * Public site shell (CONTRACTS.md — "Public routes"):
 * providers → preloader → skip link → header → main → footer → cookie banner.
 * Settings + navigation are fetched once here, server-side.
 */

function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seoDefaults.title ?? settings.siteName;
  return {
    metadataBase: siteUrl(),
    title: {
      default: title,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.seoDefaults.description,
    openGraph: {
      siteName: settings.siteName,
      type: "website",
      ...(settings.seoDefaults.ogImage
        ? { images: [{ url: settings.seoDefaults.ogImage }] }
        : {}),
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, nav] = await Promise.all([getSettings(), getNavigation()]);

  return (
    <SiteProviders>
      <Preloader logoText={settings.branding.logoText} />
      <a
        href="#main"
        className="fixed left-4 top-4 z-[120] -translate-y-[200%] rounded-pill bg-ink px-5 py-3 text-sm font-semibold text-plaster opacity-0 transition-transform focus-visible:translate-y-0 focus-visible:opacity-100"
      >
        Skip to content
      </a>
      <SiteHeader nav={nav.header} settings={settings} social={nav.social} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <SiteFooter nav={nav} settings={settings} />
      <CookieBanner />
      {/* Organization JSON-LD — injected exactly once for every public page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(settings)),
        }}
      />
    </SiteProviders>
  );
}
