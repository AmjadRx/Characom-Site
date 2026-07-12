"use client";

/**
 * /admin/pages/edit?slug=<slug> — THE block builder (ARCHITECTURE §7.3).
 *
 * Three panes: sortable section list · auto-generated block form · page panel.
 * Toolbar: Save draft / Preview (draft mode) / Publish. The working copy is
 * page.draftSections ?? page.sections; saving writes draftSections, publishing
 * promotes them to the live sections server-side.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { BLOCK_DEFS, type BlockType } from "@/lib/blocks/defs";
import type { Page, Role, Section } from "@/lib/content/types";
import { cn, newId } from "@/lib/utils";
import {
  Button,
  ConfirmDialog,
  ErrorNote,
  LoadingRow,
  StatusChip,
  cardCls,
  errMessage,
  getJson,
  sendJson,
  useNotify,
  useUnsavedGuard,
} from "@/components/admin/collections/kit";
import { IconArrowLeft, IconExternal } from "@/components/admin/collections/icons";
import { MediaPickerHost } from "@/components/admin/media";
import SectionList from "./SectionList";
import AddBlockModal from "./AddBlockModal";
import BlockForm from "./BlockForm";
import PagePanel, { type PageMeta } from "./PagePanel";

function validateSections(sections: Section[]): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const section of sections) {
    const def = BLOCK_DEFS[section.type as BlockType];
    if (!def) {
      found[section.id] = [`Unknown block type “${section.type}”.`];
      continue;
    }
    const parsed = def.schema.safeParse(section.props);
    if (!parsed.success) {
      found[section.id] = parsed.error.issues.map(
        (issue) =>
          `${issue.path.join(".") || "props"}: ${issue.message}`,
      );
    }
  }
  return found;
}

export default function PageBuilder() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  if (!slug) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-stone">
          No page selected. Pick a page to edit from the pages list.
        </p>
        <Link
          href="/admin/pages"
          className="mt-3 inline-block text-sm font-semibold text-gold-deep underline underline-offset-2"
        >
          Back to pages
        </Link>
      </div>
    );
  }

  return <PageBuilderInner slug={slug} />;
}

function PageBuilderInner({ slug }: { slug: string }) {
  const notify = useNotify();
  const queryClient = useQueryClient();

  const pageQuery = useQuery({
    queryKey: ["admin", "page", slug],
    queryFn: () => getJson<Page>(`pages/detail?slug=${encodeURIComponent(slug)}`),
  });
  const whoQuery = useQuery({
    queryKey: ["admin", "whoami"],
    queryFn: () => getJson<{ email: string; role: Role }>("whoami"),
    staleTime: Infinity,
  });
  const role: Role | null = whoQuery.data?.role ?? null;

  const page = pageQuery.data ?? null;

  // Working copy — draftSections take precedence over live sections.
  const [working, setWorking] = useState<Section[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<Record<string, string[]>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const loadedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!page || loadedSlugRef.current === page.slug) return;
    loadedSlugRef.current = page.slug;
    const sections = structuredClone(page.draftSections ?? page.sections);
    setWorking(sections);
    setMeta({ title: page.title, seo: { ...page.seo } });
    setSelectedId(sections[0]?.id ?? null);
    setDirty(false);
    setIssues({});
  }, [page]);

  useUnsavedGuard(dirty);

  const updateSections = useCallback(
    (updater: (prev: Section[]) => Section[]) => {
      setWorking((prev) => (prev ? updater(prev) : prev));
      setDirty(true);
    },
    [],
  );

  /* ── Section operations (all immutable) ─────────────────────────────── */

  const addSection = useCallback(
    (type: BlockType) => {
      const section: Section = {
        id: newId("sec"),
        type,
        props: structuredClone(BLOCK_DEFS[type].defaults),
        visible: true,
      };
      updateSections((prev) => [...prev, section]);
      setSelectedId(section.id);
      setAddOpen(false);
    },
    [updateSections],
  );

  const duplicateSection = useCallback(
    (id: string) => {
      if (!working) return;
      const index = working.findIndex((s) => s.id === id);
      if (index === -1) return;
      const copy: Section = {
        ...structuredClone(working[index]),
        id: newId("sec"),
      };
      setWorking([
        ...working.slice(0, index + 1),
        copy,
        ...working.slice(index + 1),
      ]);
      setSelectedId(copy.id);
      setDirty(true);
    },
    [working],
  );

  const deleteSection = useCallback(
    (id: string) => {
      if (!working) return;
      const index = working.findIndex((s) => s.id === id);
      if (index === -1) return;
      const next = working.filter((s) => s.id !== id);
      setWorking(next);
      setDirty(true);
      if (selectedId === id) {
        setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
      }
      setIssues((prev) => {
        if (!prev[id]) return prev;
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
    },
    [working, selectedId],
  );

  const toggleVisible = useCallback(
    (id: string) => {
      updateSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
      );
    },
    [updateSections],
  );

  const reorderSections = useCallback(
    (activeId: string, overId: string) => {
      updateSections((prev) => {
        const from = prev.findIndex((s) => s.id === activeId);
        const to = prev.findIndex((s) => s.id === overId);
        if (from === -1 || to === -1) return prev;
        return arrayMove(prev, from, to);
      });
    },
    [updateSections],
  );

  const changeProp = useCallback(
    (sectionId: string, name: string, value: unknown) => {
      updateSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, props: { ...s.props, [name]: value } }
            : s,
        ),
      );
    },
    [updateSections],
  );

  /* ── Save / publish / preview ───────────────────────────────────────── */

  const saveMutation = useMutation<Page, Error, { publish: boolean }>({
    mutationFn: async ({ publish }) => {
      if (!page || !working || !meta) throw new Error("Page is still loading.");
      const found = validateSections(working);
      setIssues(found);
      const issueCount = Object.keys(found).length;
      if (issueCount > 0) {
        throw new Error(
          `Fix the ${issueCount} highlighted block${issueCount === 1 ? "" : "s"} before saving.`,
        );
      }
      const payload: Page = {
        ...page,
        title: meta.title.trim() || page.title,
        seo: meta.seo,
        draftSections: working,
        updatedAt: new Date().toISOString(),
      };
      return sendJson<Page>(
        `pages/detail?slug=${encodeURIComponent(page.slug)}`,
        "PUT",
        publish ? { page: payload, publish: true } : { page: payload },
      );
    },
    onSuccess: (saved, { publish }) => {
      queryClient.setQueryData(["admin", "page", slug], saved);
      queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      // Re-sync the working copy from the server response (publish clears
      // draftSections). Section ids are preserved, so selection survives.
      loadedSlugRef.current = saved.slug;
      setWorking(structuredClone(saved.draftSections ?? saved.sections));
      setMeta({ title: saved.title, seo: { ...saved.seo } });
      setDirty(false);
      notify(publish ? "Page published — live in seconds." : "Draft saved.");
    },
    onError: (err) => notify(errMessage(err), "error"),
  });

  const handlePreview = useCallback(async () => {
    try {
      if (dirty) {
        await saveMutation.mutateAsync({ publish: false });
      }
      window.open(
        `/api/preview?slug=${encodeURIComponent(slug)}`,
        "_blank",
        "noopener",
      );
    } catch {
      // save failed — toast already shown, do not open the preview
    }
  }, [dirty, saveMutation, slug]);

  /* ── Render ─────────────────────────────────────────────────────────── */

  if (pageQuery.isLoading || !page || !working || !meta) {
    if (pageQuery.error) {
      return (
        <div className="mx-auto max-w-lg py-16">
          <ErrorNote error={pageQuery.error} onRetry={() => void pageQuery.refetch()} />
          <Link
            href="/admin/pages"
            className="mt-4 inline-block text-sm font-semibold text-gold-deep underline underline-offset-2"
          >
            Back to pages
          </Link>
        </div>
      );
    }
    return <LoadingRow label="Loading page…" />;
  }

  const selectedSection = working.find((s) => s.id === selectedId) ?? null;
  const saving = saveMutation.isPending;

  return (
    <div>
      <MediaPickerHost />

      {/* Toolbar */}
      <div
        className={cn(
          cardCls,
          "sticky top-2 z-30 flex flex-wrap items-center gap-3 px-4 py-3 shadow-sm",
        )}
      >
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-ink"
        >
          <IconArrowLeft />
          Pages
        </Link>
        <span className="h-5 w-px bg-ink/10" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-ink">
            {meta.title || page.title}
          </p>
          <p className="flex items-center gap-2 text-xs text-stone">
            <code>/{page.slug}</code>
            <StatusChip value={page.status} />
            {dirty ? (
              <span className="inline-flex items-center gap-1 font-semibold text-gold-deep">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-gold"
                  aria-hidden="true"
                />
                Unsaved changes
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => void handlePreview()} disabled={saving}>
            <span className="inline-flex items-center gap-1.5">
              <IconExternal />
              Preview
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => saveMutation.mutate({ publish: false })}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            variant="primary"
            onClick={() => setConfirmPublish(true)}
            disabled={saving}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Panes */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_320px]">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1">
          <SectionList
            sections={working}
            selectedId={selectedId}
            issues={issues}
            onSelect={setSelectedId}
            onReorder={reorderSections}
            onToggleVisible={toggleVisible}
            onDuplicate={duplicateSection}
            onDelete={(id) => {
              const section = working.find((s) => s.id === id);
              if (section) setPendingDelete(section);
            }}
            onAdd={() => setAddOpen(true)}
          />
        </aside>

        <div className="min-w-0">
          {selectedSection ? (
            <BlockForm
              key={selectedSection.id}
              section={selectedSection}
              role={role}
              issues={issues[selectedSection.id] ?? []}
              onPropChange={(name, value) =>
                changeProp(selectedSection.id, name, value)
              }
            />
          ) : (
            <div
              className={`${cardCls} px-6 py-16 text-center text-sm text-stone`}
            >
              {working.length === 0
                ? "This page is empty. Add your first block from the left panel."
                : "Select a section on the left to edit its content."}
            </div>
          )}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto xl:pr-1">
          <PagePanel
            page={page}
            meta={meta}
            onMetaChange={(next) => {
              setMeta(next);
              setDirty(true);
            }}
          />
        </aside>
      </div>

      {/* Modals */}
      <AddBlockModal
        open={addOpen}
        role={role}
        onClose={() => setAddOpen(false)}
        onPick={addSection}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this section?"
        message={
          pendingDelete
            ? `The “${BLOCK_DEFS[pendingDelete.type as BlockType]?.label ?? pendingDelete.type}” section and its content will be removed from the working copy.`
            : ""
        }
        confirmLabel="Delete section"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteSection(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this page?"
        message={`The current working copy becomes the live version at /${page.slug === "home" ? "" : page.slug}. This also saves your changes.`}
        confirmLabel="Publish"
        danger={false}
        busy={saving}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => {
          saveMutation.mutate(
            { publish: true },
            { onSettled: () => setConfirmPublish(false) },
          );
        }}
      />
    </div>
  );
}
