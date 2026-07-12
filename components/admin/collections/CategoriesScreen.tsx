"use client";

/**
 * /admin/categories — portfolio category CRUD: name, slug, theme color,
 * cover image, intro, ordering. Deleting warns when projects still
 * reference the category.
 */

import { useMemo, useState } from "react";
import type { Category, Project, ThemeColor } from "@/lib/content/types";
import { cn, newId, slugify } from "@/lib/utils";
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
  Thumb,
  cardCls,
  fd,
  tdCls,
  thCls,
  useAdminList,
  useSaveList,
} from "./kit";
import { IconDown, IconPencil, IconPlus, IconTrash, IconUp } from "./icons";
import { MediaPickerHost } from "@/components/admin/media";

const THEME_OPTIONS = [
  { label: "Gold (Residential)", value: "gold" },
  { label: "Cypress green (Government)", value: "cypress" },
  { label: "Aegean blue (Real Estate)", value: "aegean" },
];

const THEME_SWATCH: Record<ThemeColor, string> = {
  gold: "bg-gold",
  cypress: "bg-cypress",
  aegean: "bg-aegean",
};

function blankCategory(sortOrder: number): Category {
  return {
    id: newId("cat"),
    name: "",
    slug: "",
    themeColor: "gold",
    coverImage: "",
    coverImageAlt: "",
    intro: "",
    sortOrder,
  };
}

export default function CategoriesScreen() {
  const categoriesQuery = useAdminList<Category[]>("categories");
  const projectsQuery = useAdminList<Project[]>("projects");
  const saveList = useSaveList<Category[]>("categories", "Categories saved.");

  const [editing, setEditing] = useState<{ category: Category; isNew: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categoriesQuery.data],
  );
  const projects = projectsQuery.data ?? [];

  const referencingCount = (categoryId: string) =>
    projects.filter((p) => p.categoryId === categoryId).length;

  const move = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= categories.length) return;
    const next = categories.slice();
    [next[index], next[to]] = [next[to], next[index]];
    saveList.mutate(next.map((c, i) => ({ ...c, sortOrder: i })));
  };

  const handleSave = async (draft: Category, isNew: boolean) => {
    const next = isNew
      ? [...categories, draft]
      : categories.map((c) => (c.id === draft.id ? draft : c));
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
      categories
        .filter((c) => c.id !== pendingDelete.id)
        .map((c, i) => ({ ...c, sortOrder: i })),
      {
        onSuccess: () => setPendingDelete(null),
        onError: () => setPendingDelete(null),
      },
    );
  };

  return (
    <div>
      <MediaPickerHost />
      <ScreenHeader
        title="Categories"
        description="Portfolio sectors. Each category gets its own themed route, panel and project grid automatically."
        actions={
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                category: blankCategory(categories.length),
                isNew: true,
              })
            }
          >
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              New category
            </span>
          </Button>
        }
      />

      {categoriesQuery.isLoading ? (
        <LoadingRow label="Loading categories…" />
      ) : categoriesQuery.error ? (
        <ErrorNote
          error={categoriesQuery.error}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          text="Add your first portfolio sector — e.g. Government & Infrastructure."
          action={
            <Button
              variant="primary"
              onClick={() =>
                setEditing({ category: blankCategory(0), isNew: true })
              }
            >
              New category
            </Button>
          }
        />
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={thCls}>Category</th>
                <th className={thCls}>Slug</th>
                <th className={thCls}>Theme</th>
                <th className={thCls}>Projects</th>
                <th className={thCls}>Order</th>
                <th className={thCls}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={category.id}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-plaster/60"
                >
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <Thumb
                        src={category.coverImage}
                        alt=""
                        className="h-11 w-14 shrink-0 rounded-input"
                      />
                      <button
                        type="button"
                        onClick={() => setEditing({ category, isNew: false })}
                        className="max-w-[240px] truncate text-left font-medium text-ink hover:text-gold-deep"
                      >
                        {category.name || "Untitled category"}
                      </button>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <code className="text-xs text-stone">
                      /portfolio/{category.slug}
                    </code>
                  </td>
                  <td className={tdCls}>
                    <span className="inline-flex items-center gap-2 text-sm capitalize text-stone">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-3 w-3 rounded-full",
                          THEME_SWATCH[category.themeColor],
                        )}
                      />
                      {category.themeColor}
                    </span>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>
                    {referencingCount(category.id)}
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Move “${category.name}” up`}
                        disabled={index === 0 || saveList.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <IconUp />
                      </IconButton>
                      <IconButton
                        label={`Move “${category.name}” down`}
                        disabled={
                          index === categories.length - 1 || saveList.isPending
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
                        label={`Edit “${category.name}”`}
                        onClick={() => setEditing({ category, isNew: false })}
                      >
                        <IconPencil />
                      </IconButton>
                      <IconButton
                        label={`Delete “${category.name}”`}
                        tone="danger"
                        onClick={() => setPendingDelete(category)}
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
        <CategoryEditor
          key={editing.category.id}
          initial={editing.category}
          isNew={editing.isNew}
          existingSlugs={categories
            .filter((c) => c.id !== editing.category.id)
            .map((c) => c.slug)}
          saving={saveList.isPending}
          onSave={(draft) => void handleSave(draft, editing.isNew)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this category?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and its portfolio route will be removed.`
            : ""
        }
        detail={
          pendingDelete && referencingCount(pendingDelete.id) > 0
            ? `${referencingCount(pendingDelete.id)} project${
                referencingCount(pendingDelete.id) === 1 ? " still references" : "s still reference"
              } this category and will disappear from the public portfolio until reassigned.`
            : undefined
        }
        confirmLabel="Delete category"
        busy={saveList.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ── Editor drawer ──────────────────────────────────────────────────────── */

function CategoryEditor({
  initial,
  isNew,
  existingSlugs,
  saving,
  onSave,
  onClose,
}: {
  initial: Category;
  isNew: boolean;
  existingSlugs: string[];
  saving: boolean;
  onSave: (draft: Category) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Category>(() => structuredClone(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<string[]>([]);

  const patch = (partial: Partial<Category>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  function handleSave() {
    const problems: string[] = [];
    const name = draft.name.trim();
    const slug = draft.slug.trim();
    if (!name) problems.push("Give the category a name.");
    if (!SIMPLE_SLUG_RE.test(slug)) {
      problems.push("Slug may only contain lowercase letters, numbers and dashes.");
    } else if (existingSlugs.includes(slug)) {
      problems.push(`Another category already uses the slug “${slug}”.`);
    }
    setErrors(problems);
    if (problems.length > 0) return;
    onSave({ ...draft, name, slug });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New category" : `Edit: ${initial.name}`}
      width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create category" : "Save category"}
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
              patch({ name, ...(slugTouched ? {} : { slug: slugify(name) }) });
            }}
          />
          <Field
            field={fd.text("slug", "Slug", "URL: /portfolio/<slug>")}
            value={draft.slug}
            onChange={(v) => {
              setSlugTouched(true);
              patch({ slug: String(v ?? "") });
            }}
          />
        </div>

        <Field
          field={fd.select(
            "themeColor",
            "Theme color",
            THEME_OPTIONS,
            "Tints the category page glows, underlines and counters.",
          )}
          value={draft.themeColor}
          onChange={(v) =>
            patch({
              themeColor:
                v === "cypress" || v === "aegean" ? v : ("gold" as ThemeColor),
            })
          }
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
          field={fd.textarea(
            "intro",
            "Intro",
            "Short editorial paragraph on the category page.",
          )}
          value={draft.intro}
          onChange={(v) => patch({ intro: String(v ?? "") })}
        />
      </div>
    </Drawer>
  );
}
