"use client";

/**
 * Media library (ARCHITECTURE §7.3) — grid + search + drag-drop upload with
 * required alt text and client-side downscaling, item detail editing, delete.
 * Also reused in "select" mode by MediaPickerHost as the global image picker.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MediaIndex, MediaItem } from "@/lib/content/types";
import { cn, formatDate, newId } from "@/lib/utils";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorNote,
  IconButton,
  LoadingRow,
  ScreenHeader,
  cardCls,
  commaToTags,
  errMessage,
  getJson,
  helpCls,
  inputCls,
  labelCls,
  sendJson,
  uploadMedia,
  useNotify,
} from "@/components/admin/collections/kit";
import {
  IconCheck,
  IconFile,
  IconLink,
  IconSearch,
  IconUpload,
  IconX,
} from "@/components/admin/collections/icons";
import { prepareImageForUpload } from "./downscale";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"]);

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,video/mp4,application/pdf";

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function isImageFile(name: string): boolean {
  return IMAGE_EXTS.has(fileExt(name));
}

export function mediaUrl(file: string): string {
  return `/api/media/${file}`;
}

interface PendingUpload {
  id: string;
  file: File;
  alt: string;
  preview: string | null;
  status: "ready" | "uploading" | "error";
  error?: string;
}

export interface MediaSelection {
  src: string;
  alt: string;
}

export default function MediaLibrary({
  mode = "manage",
  onSelect,
}: {
  mode?: "manage" | "select";
  onSelect?: (image: MediaSelection) => void;
}) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "media"],
    queryFn: () => getJson<MediaIndex>("media"),
  });

  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [detailFile, setDetailFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingUpload[]>([]);
  pendingRef.current = pending;

  // Revoke preview object URLs on unmount.
  useEffect(
    () => () => {
      for (const p of pendingRef.current) {
        if (p.preview) URL.revokeObjectURL(p.preview);
      }
    },
    [],
  );

  const items = useMemo(() => {
    const all = query.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.file.toLowerCase().includes(q) ||
        item.alt.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query.data, search]);

  const detailItem =
    query.data?.items.find((i) => i.file === detailFile) ?? null;

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: PendingUpload[] = [];
    for (const file of Array.from(files)) {
      next.push({
        id: newId("up"),
        file,
        alt: "",
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "ready",
      });
    }
    if (next.length > 0) setPending((prev) => [...prev, ...next]);
  }, []);

  const removePending = useCallback((id: string) => {
    setPending((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const uploadOne = useCallback(
    async (entry: PendingUpload) => {
      if (!entry.alt.trim()) return;
      setPending((prev) =>
        prev.map((p) =>
          p.id === entry.id ? { ...p, status: "uploading", error: undefined } : p,
        ),
      );
      try {
        const prepared = await prepareImageForUpload(entry.file);
        await uploadMedia(prepared, entry.alt.trim());
        removePending(entry.id);
        await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
        notify(`Uploaded “${entry.file.name}”.`, "success");
      } catch (err) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === entry.id
              ? { ...p, status: "error", error: errMessage(err) }
              : p,
          ),
        );
      }
    },
    [notify, queryClient, removePending],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles],
  );

  return (
    <div>
      {mode === "manage" ? (
        <ScreenHeader
          title="Media library"
          description="Every image and file used across the site. Alt text is required on upload — it is what screen readers announce."
        />
      ) : null}

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging
            ? "border-gold bg-gold/10"
            : "border-ink/15 bg-white hover:border-ink/30",
        )}
      >
        <span className="text-stone" aria-hidden="true">
          <IconUpload width={22} height={22} />
        </span>
        <p className="text-sm text-ink">
          Drag images here, or{" "}
          <button
            type="button"
            className="font-semibold text-gold-deep underline underline-offset-2"
            onClick={() => inputRef.current?.click()}
          >
            browse files
          </button>
        </p>
        <p className="text-xs text-stone">
          JPG, PNG, WebP, AVIF, GIF, SVG, MP4, PDF. Large images are resized to
          2560px before upload.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Choose files to upload"
          onChange={onInputChange}
        />
      </div>

      {/* Pending uploads — alt text required before upload */}
      {pending.length > 0 ? (
        <ul className="mt-4 space-y-3" aria-label="Files waiting to upload">
          {pending.map((entry) => (
            <li
              key={entry.id}
              className={cn(cardCls, "flex flex-wrap items-center gap-4 p-3")}
            >
              {entry.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.preview}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-input object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-input bg-ink/5 text-stone">
                  <IconFile />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {entry.file.name}
                </p>
                <label className="mt-1 block">
                  <span className="sr-only">
                    Alt text for {entry.file.name} (required)
                  </span>
                  <input
                    type="text"
                    value={entry.alt}
                    required
                    placeholder="Describe this image (required)"
                    className={inputCls}
                    onChange={(e) =>
                      setPending((prev) =>
                        prev.map((p) =>
                          p.id === entry.id ? { ...p, alt: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </label>
                {entry.status === "error" && entry.error ? (
                  <p className="mt-1 text-xs text-red-700" role="alert">
                    {entry.error}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  disabled={!entry.alt.trim() || entry.status === "uploading"}
                  onClick={() => void uploadOne(entry)}
                >
                  {entry.status === "uploading" ? "Uploading…" : "Upload"}
                </Button>
                <IconButton
                  label={`Remove ${entry.file.name} from queue`}
                  tone="danger"
                  onClick={() => removePending(entry.id)}
                  disabled={entry.status === "uploading"}
                >
                  <IconX />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Search */}
      <div className="mt-6 flex items-center gap-3">
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">Search media by name, alt text or tag</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone">
            <IconSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, alt text or tag…"
            className={cn(inputCls, "pl-9")}
          />
        </label>
        <p className="text-xs text-stone" aria-live="polite">
          {items.length} file{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Grid */}
      <div className="mt-4">
        {query.isLoading ? (
          <LoadingRow label="Loading media…" />
        ) : query.error ? (
          <ErrorNote error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={search ? "No files match your search" : "No media yet"}
            message={
              search
                ? "Try a different name, alt text or tag."
                : "Upload your first image with the dropzone above."
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <li key={item.file}>
                <button
                  type="button"
                  onClick={() =>
                    mode === "select"
                      ? onSelect?.({ src: mediaUrl(item.file), alt: item.alt })
                      : setDetailFile(item.file)
                  }
                  className={cn(
                    cardCls,
                    "group block w-full overflow-hidden text-left transition-shadow hover:shadow-md focus-visible:shadow-md",
                  )}
                >
                  <span className="relative block aspect-square w-full overflow-hidden bg-ink/5">
                    {isImageFile(item.file) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(item.file)}
                        alt={item.alt}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-stone">
                        <IconFile width={22} height={22} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          {fileExt(item.file)}
                        </span>
                      </span>
                    )}
                    {mode === "select" ? (
                      <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-plaster opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        Select
                      </span>
                    ) : null}
                  </span>
                  <span className="block px-2.5 py-2">
                    <span className="block truncate text-xs font-medium text-ink">
                      {item.file}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[11px]",
                        item.alt ? "text-stone" : "font-medium text-red-700",
                      )}
                    >
                      {item.alt || "Missing alt text"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {mode === "manage" && detailItem ? (
        <MediaDetailDrawer
          item={detailItem}
          onClose={() => setDetailFile(null)}
        />
      ) : null}
    </div>
  );
}

/* ── Detail drawer: edit alt/tags, copy URL, delete ─────────────────────── */

function MediaDetailDrawer({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [alt, setAlt] = useState(item.alt);
  const [tags, setTags] = useState(item.tags.join(", "));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const patchMutation = useMutation({
    mutationFn: () =>
      sendJson<MediaItem>("media", "PATCH", {
        file: item.file,
        alt: alt.trim(),
        tags: commaToTags(tags),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      notify("Media details saved.", "success");
    },
    onError: (err) => notify(errMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sendJson("media", "DELETE", { file: item.file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      notify(`Deleted “${item.file}”.`, "success");
      setConfirmDelete(false);
      onClose();
    },
    onError: (err) => {
      notify(errMessage(err), "error");
      setConfirmDelete(false);
    },
  });

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mediaUrl(item.file));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Could not copy — copy the URL manually.", "error");
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={item.file}
      width="md"
      footer={
        <>
          <Button
            variant="danger"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
          <Button
            variant="primary"
            onClick={() => patchMutation.mutate()}
            disabled={patchMutation.isPending}
          >
            {patchMutation.isPending ? "Saving…" : "Save details"}
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-card border border-ink/10 bg-ink/5">
        {isImageFile(item.file) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(item.file)}
            alt={item.alt}
            className="max-h-72 w-full object-contain"
          />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-stone">
            <IconFile width={26} height={26} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {fileExt(item.file)} file
            </span>
          </div>
        )}
      </div>

      <dl className="mt-4 space-y-1 text-xs text-stone">
        {item.width && item.height ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Dimensions:</dt>
            <dd>
              {item.width} × {item.height}px
            </dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="font-semibold">Uploaded:</dt>
          <dd>
            {formatDate(item.uploadedAt)}
            {item.uploadedBy ? ` by ${item.uploadedBy}` : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4">
        <div>
          <label className={labelCls} htmlFor="media-alt">
            Alt text
          </label>
          <input
            id="media-alt"
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className={inputCls}
          />
          <p className={helpCls}>
            Describes the image for screen readers and search engines.
          </p>
        </div>
        <div>
          <label className={labelCls} htmlFor="media-tags">
            Tags
          </label>
          <input
            id="media-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. residential, aerial, limassol"
            className={inputCls}
          />
          <p className={helpCls}>Comma-separated — used by the search box.</p>
        </div>
        <div>
          <span className={labelCls}>File URL</span>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-input border border-ink/10 bg-white px-3 py-2 text-xs text-ink">
              {mediaUrl(item.file)}
            </code>
            <Button variant="ghost" onClick={() => void copyUrl()}>
              <span className="inline-flex items-center gap-1.5">
                {copied ? <IconCheck /> : <IconLink />}
                {copied ? "Copied" : "Copy URL"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this file?"
        message={`“${item.file}” will be permanently removed from the media library.`}
        detail="Usage references are not tracked — if this file is still used on a page, project or article, those images will break."
        confirmLabel="Delete file"
        busy={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Drawer>
  );
}
