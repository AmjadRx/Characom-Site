import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNews, getSettings } from "@/lib/content";
import { newsArticleJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Reveal, SplitTextReveal } from "@/components/motion";
import RichText from "@/components/ui/RichText";
import { seoToMetadata } from "../../_shared/block-page";

/**
 * News article (ARCHITECTURE §5.6.3): dark editorial header with tag chips
 * and date, overlapping cover image, rich-text body at reading measure,
 * previous/next article links. NewsArticle JSON-LD injected per page.
 */

export const revalidate = 300;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getNews();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [posts, settings] = await Promise.all([getNews(), getSettings()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return seoToMetadata({
    title: post.title,
    description: post.excerpt || settings.seoDefaults.description,
    ogImage: post.coverImage || settings.seoDefaults.ogImage,
  });
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const posts = await getNews();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const post = posts[index];
  /** posts are newest-first: previous = newer, next = older */
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index < posts.length - 1 ? posts[index + 1] : null;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(newsArticleJsonLd(post)),
        }}
      />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="on-dark relative bg-ink text-plaster"
        data-nav-theme="dark"
      >
        <div className="gold-mesh absolute inset-0" aria-hidden="true" />
        <div className="container-site relative pb-24 pt-44">
          <Reveal variant="fade">
            <p className="kicker kicker--accent">Newsroom</p>
          </Reveal>
          <SplitTextReveal
            text={post.title}
            as="h1"
            className="text-display-2 mt-6 max-w-4xl text-plaster"
            delay={0.1}
          />
          <Reveal variant="rise" delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <time
                dateTime={post.publishedAt}
                className="text-sm text-plaster/70"
              >
                {formatDate(post.publishedAt)}
              </time>
              {post.tags.length > 0 ? (
                <span aria-hidden="true" className="text-plaster/40">
                  ·
                </span>
              ) : null}
              <ul className="flex flex-wrap gap-2" aria-label="Topics">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-plaster/80"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </header>

      {/* ── Cover image, pulled up over the header edge ──────────────── */}
      {post.coverImage ? (
        <div className="container-site relative z-10 -mt-10">
          <Reveal variant="clip" className="overflow-hidden rounded-card">
            <div className="relative aspect-[21/9]">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt}
                fill
                priority
                sizes="(min-width: 1440px) 1344px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      ) : null}

      {/* ── Body at editorial measure ────────────────────────────────── */}
      <div className="container-site section-pad">
        <RichText doc={post.body} className="mx-auto max-w-[68ch]" />
      </div>

      {/* ── Previous / next articles ─────────────────────────────────── */}
      {newer || older ? (
        <nav
          aria-label="More articles"
          className="container-site pb-[var(--section-pad)]"
        >
          <div className="grid gap-8 border-t border-ink/10 pt-10 md:grid-cols-2">
            <div>
              {newer ? (
                <Link href={`/news/${newer.slug}`} className="group block">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone">
                    <ArrowIcon className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                    Previous article
                  </span>
                  <span className="link-underline mt-3 inline-block font-display text-lg font-semibold text-ink">
                    {newer.title}
                  </span>
                </Link>
              ) : null}
            </div>
            <div className="md:text-right">
              {older ? (
                <Link href={`/news/${older.slug}`} className="group block">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone md:justify-end">
                    Next article
                    <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="link-underline mt-3 inline-block font-display text-lg font-semibold text-ink">
                    {older.title}
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </nav>
      ) : null}
    </article>
  );
}
