"use client";

/**
 * /admin/pages — page index list + "New page" modal.
 * Editing happens in the block builder at /admin/pages/edit?slug=<slug>.
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Page } from "@/lib/content/types";
import { formatDate, slugify } from "@/lib/utils";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorNote,
  IconButton,
  LoadingRow,
  Modal,
  PAGE_SLUG_RE,
  ScreenHeader,
  StatusChip,
  cardCls,
  errMessage,
  getJson,
  helpCls,
  inputCls,
  labelCls,
  sendJson,
  tdCls,
  thCls,
  useNotify,
} from "@/components/admin/collections/kit";
import {
  IconExternal,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@/components/admin/collections/icons";

interface PageIndexEntry {
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
}

function editHref(slug: string): string {
  return `/admin/pages/edit?slug=${encodeURIComponent(slug)}`;
}

function publicHref(slug: string): string {
  return slug === "home" ? "/" : `/${slug}`;
}

export default function PagesListScreen() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: () => getJson<PageIndexEntry[]>("pages"),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PageIndexEntry | null>(
    null,
  );

  const deleteMutation = useMutation({
    mutationFn: (slug: string) =>
      sendJson(`pages/detail?slug=${encodeURIComponent(slug)}`, "DELETE"),
    onSuccess: (_res, slug) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      notify(`Page “${slug}” deleted.`, "success");
      setPendingDelete(null);
    },
    onError: (err) => {
      notify(errMessage(err), "error");
      setPendingDelete(null);
    },
  });

  const pages = query.data ?? [];

  return (
    <div>
      <ScreenHeader
        title="Pages"
        description="Every public page is built from blocks. Create a page, compose its sections in the builder, then publish."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              New page
            </span>
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingRow label="Loading pages…" />
      ) : query.error ? (
        <ErrorNote error={query.error} onRetry={() => void query.refetch()} />
      ) : pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          message="Create your first page to start composing blocks."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              New page
            </Button>
          }
        />
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={thCls}>Title</th>
                <th className={thCls}>Slug</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Updated</th>
                <th className={thCls}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.slug}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-plaster/60"
                >
                  <td className={tdCls}>
                    <Link
                      href={editHref(page.slug)}
                      className="font-medium text-ink hover:text-gold-deep"
                    >
                      {page.title}
                    </Link>
                  </td>
                  <td className={tdCls}>
                    <code className="text-xs text-stone">/{page.slug}</code>
                  </td>
                  <td className={tdCls}>
                    <StatusChip value={page.status} />
                  </td>
                  <td className={`${tdCls} whitespace-nowrap text-stone`}>
                    {formatDate(page.updatedAt)}
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={publicHref(page.slug)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View “${page.title}” on the site (new tab)`}
                        title="View on site"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-input text-stone transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        <IconExternal />
                      </a>
                      <Link
                        href={editHref(page.slug)}
                        aria-label={`Edit “${page.title}”`}
                        title="Edit in builder"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-input text-stone transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        <IconPencil />
                      </Link>
                      <IconButton
                        label={`Delete “${page.title}”`}
                        tone="danger"
                        onClick={() => setPendingDelete(page)}
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

      <NewPageModal
        open={createOpen}
        existingSlugs={pages.map((p) => p.slug)}
        onClose={() => setCreateOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this page?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” (/${pendingDelete.slug}) and all of its sections will be permanently removed.`
            : ""
        }
        confirmLabel="Delete page"
        busy={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.slug);
        }}
      />
    </div>
  );
}

/* ── New page modal ─────────────────────────────────────────────────────── */

function NewPageModal({
  open,
  existingSlugs,
  onClose,
}: {
  open: boolean;
  existingSlugs: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (page: Page) => sendJson<Page>("pages", "POST", { page }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      notify(`Page “${created.title}” created.`, "success");
      reset();
      onClose();
      router.push(`/admin/pages/edit?slug=${encodeURIComponent(created.slug)}`);
    },
    onError: (err) => setFieldError(errMessage(err)),
  });

  function reset() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setFieldError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();
    if (!cleanTitle) {
      setFieldError("Give the page a title.");
      return;
    }
    if (!PAGE_SLUG_RE.test(cleanSlug)) {
      setFieldError(
        "Slug may contain lowercase letters, numbers and dashes — nested paths like legal/privacy are allowed.",
      );
      return;
    }
    if (existingSlugs.includes(cleanSlug)) {
      setFieldError(`A page with slug “${cleanSlug}” already exists.`);
      return;
    }
    setFieldError(null);
    createMutation.mutate({
      title: cleanTitle,
      slug: cleanSlug,
      status: "draft",
      seo: {},
      sections: [],
      draftSections: null,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="New page">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="new-page-title">
              Title
            </label>
            <input
              id="new-page-title"
              type="text"
              value={title}
              autoFocus
              className={inputCls}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="new-page-slug">
              Slug
            </label>
            <input
              id="new-page-slug"
              type="text"
              value={slug}
              className={inputCls}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
            <p className={helpCls}>
              The page URL: /{slug || "…"} — cannot be changed after creation.
            </p>
          </div>
          {fieldError ? (
            <p className="text-sm text-red-700" role="alert" aria-live="polite">
              {fieldError}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating…" : "Create page"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
