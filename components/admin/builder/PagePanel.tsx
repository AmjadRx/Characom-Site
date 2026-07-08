"use client";

/**
 * Builder right pane — page settings: title, slug (read-only after create),
 * status, and SEO (title / description / OG image via media picker).
 */

import type { Page, SEO } from "@/lib/content/types";
import { formatDate } from "@/lib/utils";
import {
  Field,
  StatusChip,
  cardCls,
  fd,
  helpCls,
  inputCls,
  labelCls,
} from "@/components/admin/collections/kit";

export interface PageMeta {
  title: string;
  seo: SEO;
}

const ogImageField = fd.image(
  "ogImage",
  "Social share image",
  "Shown when the page is shared on social platforms (1200×630 works best).",
);

export default function PagePanel({
  page,
  meta,
  onMetaChange,
}: {
  page: Page;
  meta: PageMeta;
  onMetaChange: (next: PageMeta) => void;
}) {
  const setSeo = (patch: Partial<SEO>) =>
    onMetaChange({ ...meta, seo: { ...meta.seo, ...patch } });

  return (
    <div className="space-y-5">
      <section className={`${cardCls} p-5`} aria-label="Page settings">
        <h2 className="mb-4 font-display text-base font-semibold text-ink">
          Page settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="page-title">
              Title
            </label>
            <input
              id="page-title"
              type="text"
              value={meta.title}
              className={inputCls}
              onChange={(e) => onMetaChange({ ...meta, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="page-slug">
              Slug
            </label>
            <input
              id="page-slug"
              type="text"
              value={`/${page.slug}`}
              readOnly
              aria-readonly="true"
              className={inputCls}
            />
            <p className={helpCls}>Slugs are fixed after creation.</p>
          </div>
          <dl className="space-y-2 border-t border-ink/10 pt-4 text-xs text-stone">
            <div className="flex items-center justify-between gap-2">
              <dt className="font-semibold uppercase tracking-[0.12em]">
                Status
              </dt>
              <dd>
                <StatusChip value={page.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="font-semibold uppercase tracking-[0.12em]">
                Updated
              </dt>
              <dd>{formatDate(page.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={`${cardCls} p-5`} aria-label="Search engine settings">
        <h2 className="mb-1 font-display text-base font-semibold text-ink">
          SEO
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-stone">
          Optional overrides — the site falls back to its default metadata.
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="page-seo-title">
              SEO title
            </label>
            <input
              id="page-seo-title"
              type="text"
              value={meta.seo.title ?? ""}
              className={inputCls}
              onChange={(e) => setSeo({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="page-seo-description">
              Meta description
            </label>
            <textarea
              id="page-seo-description"
              rows={3}
              value={meta.seo.description ?? ""}
              className={inputCls}
              onChange={(e) => setSeo({ description: e.target.value })}
            />
          </div>
          <Field
            field={ogImageField}
            value={{ src: meta.seo.ogImage ?? "", alt: "" }}
            onChange={(value) => {
              const image = value as { src?: string } | null;
              setSeo({ ogImage: image?.src ?? "" });
            }}
          />
        </div>
      </section>
    </div>
  );
}
