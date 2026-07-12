import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import { getNews } from "@/lib/content";
import SectionHeader from "@/components/ui/SectionHeader";
import NewsListRows, { type NewsListRow } from "./client/NewsListRows";

interface NewsListProps {
  kicker?: string;
  heading?: string;
  limit?: number;
  showAllLink?: boolean;
}

/**
 * §5.1.7 News teaser — minimal list rows (date · title · tag) that slide a
 * thumbnail preview alongside the cursor on hover. Rows stagger in; an
 * "All news" link appears when enabled.
 */
export default async function NewsList({ props }: BlockComponentProps) {
  const p = props as unknown as NewsListProps;
  const limit =
    typeof p.limit === "number" && p.limit > 0 ? Math.min(p.limit, 24) : 3;
  const posts = await getNews(limit);
  if (posts.length === 0) return null;

  const rows: NewsListRow[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    publishedAt: post.publishedAt,
    tag: post.tags[0] ?? "",
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
  }));

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />

        <NewsListRows rows={rows} />

        {p.showAllLink !== false && (
          <div className="mt-10 flex justify-end">
            <Link
              href="/news"
              className="link-underline inline-flex items-center gap-2 pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-gold-deep"
            >
              All news
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
