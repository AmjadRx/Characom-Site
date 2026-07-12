"use client";

/**
 * /admin/news — newsroom article CRUD: rich-text body, cover image, tags,
 * publish date, status. Saves PUT the whole news array (contract).
 */

import { useMemo, useState } from "react";
import type { NewsPost } from "@/lib/content/types";
import { formatDate, newId, slugify } from "@/lib/utils";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorNote,
  Field,
  IconButton,
  LoadingRow,
  ScreenHeader,
  SIMPLE_SLUG_RE,
  StatusChip,
  Thumb,
  cardCls,
  commaToTags,
  fd,
  helpCls,
  inputCls,
  labelCls,
  tdCls,
  thCls,
  useAdminList,
  useSaveList,
} from "./kit";
import { IconPencil, IconPlus, IconTrash } from "./icons";
import { MediaPickerHost } from "@/components/admin/media";

const STATUS_OPTIONS = [
  { label: "Draft (hidden from the site)", value: "draft" },
  { label: "Published", value: "published" },
];

function blankPost(): NewsPost {
  return {
    id: newId("news"),
    title: "",
    slug: "",
    excerpt: "",
    body: { type: "doc", content: [] },
    coverImage: "",
    coverImageAlt: "",
    tags: [],
    publishedAt: new Date().toISOString(),
    status: "draft",
  };
}

function toDateInputValue(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export default function NewsScreen() {
  const newsQuery = useAdminList<NewsPost[]>("news");
  const saveList = useSaveList<NewsPost[]>("news", "News saved.");

  const [editing, setEditing] = useState<{ post: NewsPost; isNew: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NewsPost | null>(null);

  const posts = useMemo(
    () =>
      (newsQuery.data ?? [])
        .slice()
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [newsQuery.data],
  );

  const handleSave = async (draft: NewsPost, isNew: boolean) => {
    const next = isNew
      ? [draft, ...posts]
      : posts.map((p) => (p.id === draft.id ? draft : p));
    try {
      await saveList.mutateAsync(next);
      setEditing(null);
    } catch {
      // error toast already shown by useSaveList — keep the drawer open
    }
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    saveList.mutate(posts.filter((p) => p.id !== pendingDelete.id), {
      onSuccess: () => setPendingDelete(null),
      onError: () => setPendingDelete(null),
    });
  };

  return (
    <div>
      <MediaPickerHost />
      <ScreenHeader
        title="News"
        description="Articles for the newsroom. Published posts appear on /news and in news-list blocks, newest first."
        actions={
          <Button
            variant="primary"
            onClick={() => setEditing({ post: blankPost(), isNew: true })}
          >
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              New article
            </span>
          </Button>
        }
      />

      {newsQuery.isLoading ? (
        <LoadingRow label="Loading articles…" />
      ) : newsQuery.error ? (
        <ErrorNote error={newsQuery.error} onRetry={() => void newsQuery.refetch()} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No articles yet"
          text="Write your first newsroom post — it drives SEO and shows the company is active."
          action={
            <Button
              variant="primary"
              onClick={() => setEditing({ post: blankPost(), isNew: true })}
            >
              New article
            </Button>
          }
        />
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={thCls}>Article</th>
                <th className={thCls}>Published</th>
                <th className={thCls}>Tags</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-plaster/60"
                >
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <Thumb
                        src={post.coverImage}
                        alt=""
                        className="h-11 w-14 shrink-0 rounded-input"
                      />
                      <button
                        type="button"
                        onClick={() => setEditing({ post, isNew: false })}
                        className="max-w-[280px] truncate text-left font-medium text-ink hover:text-gold-deep"
                      >
                        {post.title || "Untitled article"}
                      </button>
                    </div>
                  </td>
                  <td className={`${tdCls} whitespace-nowrap text-stone`}>
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className={tdCls}>
                    <span className="block max-w-[180px] truncate text-xs text-stone">
                      {post.tags.join(", ") || "—"}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <StatusChip value={post.status} />
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        label={`Edit “${post.title}”`}
                        onClick={() => setEditing({ post, isNew: false })}
                      >
                        <IconPencil />
                      </IconButton>
                      <IconButton
                        label={`Delete “${post.title}”`}
                        tone="danger"
                        onClick={() => setPendingDelete(post)}
                      >
                        <IconTrash />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <NewsEditor
          key={editing.post.id}
          initial={editing.post}
          isNew={editing.isNew}
          existingSlugs={posts
            .filter((p) => p.id !== editing.post.id)
            .map((p) => p.slug)}
          saving={saveList.isPending}
          onSave={(draft) => void handleSave(draft, editing.isNew)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this article?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from the newsroom.`
            : ""
        }
        confirmLabel="Delete article"
        busy={saveList.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ── Editor drawer ──────────────────────────────────────────────────────── */

function NewsEditor({
  initial,
  isNew,
  existingSlugs,
  saving,
  onSave,
  onClose,
}: {
  initial: NewsPost;
  isNew: boolean;
  existingSlugs: string[];
  saving: boolean;
  onSave: (draft: NewsPost) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<NewsPost>(() => structuredClone(initial));
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [dateInput, setDateInput] = useState(toDateInputValue(initial.publishedAt));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<string[]>([]);

  const patch = (partial: Partial<NewsPost>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  function handleSave() {
    const problems: string[] = [];
    const title = draft.title.trim();
    const slug = draft.slug.trim();
    if (!title) problems.push("Give the article a title.");
    if (!SIMPLE_SLUG_RE.test(slug)) {
      problems.push("Slug may only contain lowercase letters, numbers and dashes.");
    } else if (existingSlugs.includes(slug)) {
      problems.push(`Another article already uses the slug “${slug}”.`);
    }
    let publishedAt = draft.publishedAt;
    if (dateInput) {
      const parsed = new Date(dateInput);
      if (Number.isNaN(parsed.getTime())) {
        problems.push("Enter a valid publish date.");
      } else if (dateInput !== toDateInputValue(draft.publishedAt)) {
        publishedAt = parsed.toISOString();
      }
    } else {
      problems.push("Choose a publish date.");
    }
    setErrors(problems);
    if (problems.length > 0) return;
    onSave({
      ...draft,
      title,
      slug,
      publishedAt,
      tags: commaToTags(tagsInput),
    });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New article" : `Edit: ${initial.title}`}
      width="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create article" : "Save article"}
          </Button>
        </>
      }
    >
      <div aria-live="polite">
        {errors.length > 0 ? (
          <ul
            className="mb-5 list-disc rounded-card border border-red-200 bg-red-50 py-3 pl-8 pr-4 text-sm text-red-800"
            role="alert"
          >
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            field={fd.text("title", "Title")}
            value={draft.title}
            onChange={(v) => {
              const title = String(v ?? "");
              patch({ title, ...(slugTouched ? {} : { slug: slugify(title) }) });
            }}
          />
          <Field
            field={fd.text("slug", "Slug", "URL: /news/<slug>")}
            value={draft.slug}
            onChange={(v) => {
              setSlugTouched(true);
              patch({ slug: String(v ?? "") });
            }}
          />
        </div>

        <Field
          field={fd.textarea(
            "excerpt",
            "Excerpt",
            "Short teaser shown in article lists.",
          )}
          value={draft.excerpt}
          onChange={(v) => patch({ excerpt: String(v ?? "") })}
        />

        <Field
          field={fd.richtext("body", "Body")}
          value={draft.body}
          onChange={(v) => patch({ body: v as NewsPost["body"] })}
        />

        <Field
          field={fd.image("coverImage", "Cover image")}
          value={{ src: draft.coverImage, alt: draft.coverImageAlt }}
          onChange={(v) => {
            const image = (v ?? {}) as { src?: string; alt?: string };
            patch({
              coverImage: image.src ?? "",
              coverImageAlt: image.alt ?? "",
            });
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="news-tags">
              Tags
            </label>
            <input
              id="news-tags"
              type="text"
              value={tagsInput}
              className={inputCls}
              placeholder="e.g. awards, infrastructure"
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className={helpCls}>Comma-separated.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="news-date">
              Publish date
            </label>
            <input
              id="news-date"
              type="date"
              value={dateInput}
              className={inputCls}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>
        </div>

        <Field
          field={fd.select("status", "Status", STATUS_OPTIONS)}
          value={draft.status}
          onChange={(v) =>
            patch({ status: v === "published" ? "published" : "draft" })
          }
        />
      </div>
    </Drawer>
  );
}
