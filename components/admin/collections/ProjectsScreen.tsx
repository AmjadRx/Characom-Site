"use client";

/**
 * /admin/projects — project CRUD: sortable table (featured toggle, ordering)
 * plus a full editor drawer with gallery manager (ARCHITECTURE §7.3).
 * Saves always PUT the whole projects array (contract).
 */

import { useMemo, useState } from "react";
import type { Category, Project } from "@/lib/content/types";
import { newId, slugify } from "@/lib/utils";
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
  fd,
  tdCls,
  thCls,
  useAdminList,
  useSaveList,
} from "./kit";
import {
  IconDown,
  IconPencil,
  IconPlus,
  IconStar,
  IconTrash,
  IconUp,
} from "./icons";
import GalleryManager from "./GalleryManager";
import { MediaPickerHost } from "@/components/admin/media";

const STATUS_OPTIONS = [
  { label: "Completed", value: "completed" },
  { label: "In progress", value: "in_progress" },
];

const PAGE_STATUS_OPTIONS = [
  { label: "Draft (hidden from the site)", value: "draft" },
  { label: "Published", value: "published" },
];

function blankProject(categories: Category[], sortOrder: number): Project {
  return {
    id: newId("proj"),
    categoryId: categories[0]?.id ?? "",
    name: "",
    slug: "",
    location: "",
    year: new Date().getFullYear(),
    status: "in_progress",
    client: "",
    valueLabel: "",
    summary: "",
    body: { type: "doc", content: [] },
    coverImage: "",
    coverImageAlt: "",
    specs: [],
    images: [],
    videoEmbedUrl: "",
    isFeatured: false,
    sortOrder,
    pageStatus: "draft",
    seo: {},
  };
}

export default function ProjectsScreen() {
  const projectsQuery = useAdminList<Project[]>("projects");
  const categoriesQuery = useAdminList<Category[]>("categories");
  const saveList = useSaveList<Project[]>("projects", "Projects saved.");

  const [editing, setEditing] = useState<{ project: Project; isNew: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const projects = useMemo(
    () => (projectsQuery.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [projectsQuery.data],
  );
  const categories = categoriesQuery.data ?? [];
  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const putAll = (next: Project[]) => saveList.mutate(next);

  const toggleFeatured = (project: Project) =>
    putAll(
      projects.map((p) =>
        p.id === project.id ? { ...p, isFeatured: !p.isFeatured } : p,
      ),
    );

  const move = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= projects.length) return;
    const next = projects.slice();
    [next[index], next[to]] = [next[to], next[index]];
    putAll(next.map((p, i) => ({ ...p, sortOrder: i })));
  };

  const handleSave = async (draft: Project, isNew: boolean) => {
    const next = isNew
      ? [...projects, draft]
      : projects.map((p) => (p.id === draft.id ? draft : p));
    try {
      await saveList.mutateAsync(next);
      setEditing(null);
    } catch {
      // error toast already shown by useSaveList — keep the drawer open
    }
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    saveList.mutate(
      projects
        .filter((p) => p.id !== pendingDelete.id)
        .map((p, i) => ({ ...p, sortOrder: i })),
      { onSuccess: () => setPendingDelete(null), onError: () => setPendingDelete(null) },
    );
  };

  const loading = projectsQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div>
      <MediaPickerHost />
      <ScreenHeader
        title="Projects"
        description="Portfolio case studies. Featured projects appear in the home showcase; order controls their sequence everywhere."
        actions={
          <Button
            variant="primary"
            disabled={categories.length === 0}
            onClick={() =>
              setEditing({
                project: blankProject(categories, projects.length),
                isNew: true,
              })
            }
          >
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              New project
            </span>
          </Button>
        }
      />

      {loading ? (
        <LoadingRow label="Loading projects…" />
      ) : projectsQuery.error ? (
        <ErrorNote
          error={projectsQuery.error}
          onRetry={() => void projectsQuery.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Create a category first"
          text="Projects belong to a portfolio category — add one under Categories, then come back."
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          text="Add your first case study — cover image, facts, gallery and story."
          action={
            <Button
              variant="primary"
              onClick={() =>
                setEditing({ project: blankProject(categories, 0), isNew: true })
              }
            >
              New project
            </Button>
          }
        />
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={thCls}>Project</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Year</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Page</th>
                <th className={thCls}>Featured</th>
                <th className={thCls}>Order</th>
                <th className={thCls}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-plaster/60"
                >
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <Thumb
                        src={project.coverImage}
                        alt=""
                        className="h-11 w-14 shrink-0 rounded-input"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setEditing({ project, isNew: false })}
                          className="block max-w-[220px] truncate text-left font-medium text-ink hover:text-gold-deep"
                        >
                          {project.name || "Untitled project"}
                        </button>
                        <span className="block truncate text-xs text-stone">
                          {project.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <span className="text-sm text-stone">
                      {categoryName.get(project.categoryId) ?? "—"}
                    </span>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>{project.year}</td>
                  <td className={tdCls}>
                    <StatusChip value={project.status} />
                  </td>
                  <td className={tdCls}>
                    <StatusChip value={project.pageStatus} />
                  </td>
                  <td className={tdCls}>
                    <IconButton
                      label={
                        project.isFeatured
                          ? `Remove “${project.name}” from featured`
                          : `Feature “${project.name}” on the home showcase`
                      }
                      pressed={project.isFeatured}
                      tone="gold"
                      onClick={() => toggleFeatured(project)}
                      disabled={saveList.isPending}
                    >
                      <IconStar filled={project.isFeatured} />
                    </IconButton>
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Move “${project.name}” up`}
                        disabled={index === 0 || saveList.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <IconUp />
                      </IconButton>
                      <IconButton
                        label={`Move “${project.name}” down`}
                        disabled={
                          index === projects.length - 1 || saveList.isPending
                        }
                        onClick={() => move(index, 1)}
                      >
                        <IconDown />
                      </IconButton>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        label={`Edit “${project.name}”`}
                        onClick={() => setEditing({ project, isNew: false })}
                      >
                        <IconPencil />
                      </IconButton>
                      <IconButton
                        label={`Delete “${project.name}”`}
                        tone="danger"
                        onClick={() => setPendingDelete(project)}
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
        <ProjectEditor
          key={editing.project.id}
          initial={editing.project}
          isNew={editing.isNew}
          categories={categories}
          existingSlugs={projects
            .filter((p) => p.id !== editing.project.id)
            .map((p) => p.slug)}
          saving={saveList.isPending}
          onSave={(draft) => void handleSave(draft, editing.isNew)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this project?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and its gallery references will be removed from the portfolio.`
            : ""
        }
        confirmLabel="Delete project"
        busy={saveList.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ── Editor drawer ──────────────────────────────────────────────────────── */

function ProjectEditor({
  initial,
  isNew,
  categories,
  existingSlugs,
  saving,
  onSave,
  onClose,
}: {
  initial: Project;
  isNew: boolean;
  categories: Category[];
  existingSlugs: string[];
  saving: boolean;
  onSave: (draft: Project) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Project>(() => structuredClone(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<string[]>([]);

  const patch = (partial: Partial<Project>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  function handleSave() {
    const problems: string[] = [];
    const name = draft.name.trim();
    const slug = draft.slug.trim();
    if (!name) problems.push("Give the project a name.");
    if (!SIMPLE_SLUG_RE.test(slug)) {
      problems.push("Slug may only contain lowercase letters, numbers and dashes.");
    } else if (existingSlugs.includes(slug)) {
      problems.push(`Another project already uses the slug “${slug}”.`);
    }
    if (!draft.categoryId) problems.push("Choose a category.");
    if (!Number.isFinite(draft.year)) problems.push("Enter a valid year.");
    setErrors(problems);
    if (problems.length > 0) return;
    onSave({ ...draft, name, slug });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New project" : `Edit: ${initial.name}`}
      width="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create project" : "Save project"}
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
            field={fd.text("name", "Name")}
            value={draft.name}
            onChange={(v) => {
              const name = String(v ?? "");
              patch({
                name,
                ...(slugTouched ? {} : { slug: slugify(name) }),
              });
            }}
          />
          <Field
            field={fd.text("slug", "Slug", "Used in the project URL.")}
            value={draft.slug}
            onChange={(v) => {
              setSlugTouched(true);
              patch({ slug: String(v ?? "") });
            }}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            field={fd.select("categoryId", "Category", categoryOptions)}
            value={draft.categoryId}
            onChange={(v) => patch({ categoryId: String(v ?? "") })}
          />
          <Field
            field={fd.text("location", "Location", "e.g. Nicosia, Cyprus")}
            value={draft.location}
            onChange={(v) => patch({ location: String(v ?? "") })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            field={fd.number("year", "Year")}
            value={draft.year}
            onChange={(v) => patch({ year: Number(v ?? 0) })}
          />
          <Field
            field={fd.select("status", "Project status", STATUS_OPTIONS)}
            value={draft.status}
            onChange={(v) =>
              patch({ status: v === "completed" ? "completed" : "in_progress" })
            }
          />
          <Field
            field={fd.select("pageStatus", "Page status", PAGE_STATUS_OPTIONS)}
            value={draft.pageStatus}
            onChange={(v) =>
              patch({ pageStatus: v === "published" ? "published" : "draft" })
            }
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            field={fd.text("client", "Client (optional)")}
            value={draft.client ?? ""}
            onChange={(v) => patch({ client: String(v ?? "") })}
          />
          <Field
            field={fd.text(
              "valueLabel",
              "Value label (optional)",
              "Shown in the meta row, e.g. “€12M”.",
            )}
            value={draft.valueLabel ?? ""}
            onChange={(v) => patch({ valueLabel: String(v ?? "") })}
          />
        </div>

        <Field
          field={fd.textarea(
            "summary",
            "Summary",
            "One or two sentences shown on cards and under the case-study title.",
          )}
          value={draft.summary}
          onChange={(v) => patch({ summary: String(v ?? "") })}
        />

        <Field
          field={fd.richtext("body", "Narrative", "The case-study story.")}
          value={draft.body}
          onChange={(v) => patch({ body: v as Project["body"] })}
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

        <Field
          field={fd.list(
            "specs",
            "Spec sheet",
            "Spec",
            [fd.text("label", "Label"), fd.text("value", "Value")],
            "Fact table rows: scope, sq.m, duration, services…",
          )}
          value={draft.specs}
          onChange={(v) => patch({ specs: (v as Project["specs"]) ?? [] })}
        />

        <GalleryManager
          images={draft.images}
          onChange={(images) => patch({ images })}
        />

        <Field
          field={fd.text(
            "videoEmbedUrl",
            "Video embed URL (optional)",
            "YouTube/Vimeo embed URL shown inside the gallery.",
          )}
          value={draft.videoEmbedUrl ?? ""}
          onChange={(v) => patch({ videoEmbedUrl: String(v ?? "") })}
        />

        <Field
          field={fd.boolean(
            "isFeatured",
            "Featured project",
            "Featured projects appear in the home showcase.",
          )}
          value={draft.isFeatured}
          onChange={(v) => patch({ isFeatured: Boolean(v) })}
        />

        <section className="border-t border-ink/10 pt-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink">
            SEO (optional)
          </h3>
          <div className="space-y-5">
            <Field
              field={fd.text("seoTitle", "SEO title")}
              value={draft.seo?.title ?? ""}
              onChange={(v) =>
                patch({ seo: { ...draft.seo, title: String(v ?? "") } })
              }
            />
            <Field
              field={fd.textarea("seoDescription", "Meta description")}
              value={draft.seo?.description ?? ""}
              onChange={(v) =>
                patch({ seo: { ...draft.seo, description: String(v ?? "") } })
              }
            />
            <Field
              field={fd.image("seoOgImage", "Social share image")}
              value={{ src: draft.seo?.ogImage ?? "", alt: "" }}
              onChange={(v) => {
                const image = (v ?? {}) as { src?: string };
                patch({ seo: { ...draft.seo, ogImage: image.src ?? "" } });
              }}
            />
          </div>
        </section>
      </div>
    </Drawer>
  );
}
