import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/registry";
import { getCategories, getCategoryBySlug, getSettings } from "@/lib/content";
import type { Section } from "@/lib/content/types";
import { seoToMetadata, themeVars } from "../../_shared/block-page";

/**
 * Portfolio category page (ARCHITECTURE §5.3): themed hero + breadcrumb +
 * filterable FLIP project grid. Composed from block instances directly so
 * the choreography matches the page-builder output exactly.
 */

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const [category, settings] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getSettings(),
  ]);
  if (!category) return {};
  return seoToMetadata({
    title: `${category.name} — Portfolio`,
    description: category.intro || settings.seoDefaults.description,
    ogImage: category.coverImage || settings.seoDefaults.ogImage,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const pathname = `/portfolio/${category.slug}`;
  const ctx = {
    pathname,
    categorySlug: category.slug,
    theme: category.themeColor,
  };
  const heroSection: Section = {
    id: `category-hero-${category.slug}`,
    type: "pageHero",
    props: {
      kicker: "Portfolio",
      heading: category.name,
      subheading: category.intro,
      theme: category.themeColor,
      dark: true,
    },
    visible: true,
  };
  const gridSection: Section = {
    id: `category-grid-${category.slug}`,
    type: "projectGrid",
    props: { categorySlug: category.slug, showFilters: true },
    visible: true,
  };

  return (
    <div style={themeVars(category.themeColor)}>
      <BlockRenderer sections={[heroSection]} ctx={ctx} />
      <nav aria-label="Breadcrumb" className="border-b border-ink/10 bg-plaster">
        <div className="container-site flex items-center gap-3 py-4 text-sm">
          <Link
            href="/portfolio"
            className="link-underline text-stone transition-colors hover:text-ink"
          >
            Portfolio
          </Link>
          <span aria-hidden="true" className="text-stone">
            /
          </span>
          <span aria-current="page" className="font-medium text-ink">
            {category.name}
          </span>
        </div>
      </nav>
      <BlockRenderer sections={[gridSection]} ctx={ctx} />
    </div>
  );
}
