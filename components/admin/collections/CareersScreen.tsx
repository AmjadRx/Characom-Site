"use client";

/**
 * /admin/careers — open position CRUD: title, department, location, type,
 * rich-text description, open/closed toggle, ordering.
 */

import { useMemo, useState } from "react";
import type { CareerPosition } from "@/lib/content/types";
import { newId } from "@/lib/utils";
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
  StatusChip,
  cardCls,
  fd,
  tdCls,
  thCls,
  useAdminList,
  useSaveList,
} from "./kit";
import {
  IconDown,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUp,
} from "./icons";

function blankPosition(sortOrder: number): CareerPosition {
  return {
    id: newId("job"),
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    description: { type: "doc", content: [] },
    isOpen: true,
    sortOrder,
  };
}

export default function CareersScreen() {
  const careersQuery = useAdminList<CareerPosition[]>("careers");
  const saveList = useSaveList<CareerPosition[]>("careers", "Positions saved.");

  const [editing, setEditing] = useState<{ position: CareerPosition; isNew: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CareerPosition | null>(null);

  const positions = useMemo(
    () =>
      (careersQuery.data ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [careersQuery.data],
  );

  const move = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= positions.length) return;
    const next = positions.slice();
    [next[index], next[to]] = [next[to], next[index]];
    saveList.mutate(next.map((p, i) => ({ ...p, sortOrder: i })));
  };

  const toggleOpen = (position: CareerPosition) =>
    saveList.mutate(
      positions.map((p) =>
        p.id === position.id ? { ...p, isOpen: !p.isOpen } : p,
      ),
    );

  const handleSave = async (draft: CareerPosition, isNew: boolean) => {
    const next = isNew
      ? [...positions, draft]
      : positions.map((p) => (p.id === draft.id ? draft : p));
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
      positions
        .filter((p) => p.id !== pendingDelete.id)
        .map((p, i) => ({ ...p, sortOrder: i })),
      {
        onSuccess: () => setPendingDelete(null),
        onError: () => setPendingDelete(null),
      },
    );
  };

  return (
    <div>
      <ScreenHeader
        title="Careers"
        description="Open positions listed on the careers page. Closed positions stay here but disappear from the site."
        actions={
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                position: blankPosition(positions.length),
                isNew: true,
              })
            }
          >
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              New position
            </span>
          </Button>
        }
      />

      {careersQuery.isLoading ? (
        <LoadingRow label="Loading positions…" />
      ) : careersQuery.error ? (
        <ErrorNote
          error={careersQuery.error}
          onRetry={() => void careersQuery.refetch()}
        />
      ) : positions.length === 0 ? (
        <EmptyState
          title="No positions yet"
          text="Add your first role — title, department, location and a description."
          action={
            <Button
              variant="primary"
              onClick={() =>
                setEditing({ position: blankPosition(0), isNew: true })
              }
            >
              New position
            </Button>
          }
        />
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={thCls}>Position</th>
                <th className={thCls}>Department</th>
                <th className={thCls}>Location</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Order</th>
                <th className={thCls}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr
                  key={position.id}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-plaster/60"
                >
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={() => setEditing({ position, isNew: false })}
                      className="max-w-[240px] truncate text-left font-medium text-ink hover:text-gold-deep"
                    >
                      {position.title || "Untitled position"}
                    </button>
                  </td>
                  <td className={`${tdCls} text-stone`}>{position.department}</td>
                  <td className={`${tdCls} text-stone`}>{position.location}</td>
                  <td className={`${tdCls} text-stone`}>{position.type}</td>
                  <td className={tdCls}>
                    <StatusChip
                      value={position.isOpen ? "open" : "closed"}
                      label={position.isOpen ? "Open" : "Closed"}
                    />
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Move “${position.title}” up`}
                        disabled={index === 0 || saveList.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <IconUp />
                      </IconButton>
                      <IconButton
                        label={`Move “${position.title}” down`}
                        disabled={
                          index === positions.length - 1 || saveList.isPending
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
                        label={
                          position.isOpen
                            ? `Close “${position.title}”`
                            : `Reopen “${position.title}”`
                        }
                        pressed={position.isOpen}
                        onClick={() => toggleOpen(position)}
                        disabled={saveList.isPending}
                      >
                        {position.isOpen ? <IconEye /> : <IconEyeOff />}
                      </IconButton>
                      <IconButton
                        label={`Edit “${position.title}”`}
                        onClick={() => setEditing({ position, isNew: false })}
                      >
                        <IconPencil />
                      </IconButton>
                      <IconButton
                        label={`Delete “${position.title}”`}
                        tone="danger"
                        onClick={() => setPendingDelete(position)}
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
        <CareerEditor
          key={editing.position.id}
          initial={editing.position}
          isNew={editing.isNew}
          saving={saveList.isPending}
          onSave={(draft) => void handleSave(draft, editing.isNew)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this position?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from the careers list.`
            : ""
        }
        confirmLabel="Delete position"
        busy={saveList.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ── Editor drawer ──────────────────────────────────────────────────────── */

function CareerEditor({
  initial,
  isNew,
  saving,
  onSave,
  onClose,
}: {
  initial: CareerPosition;
  isNew: boolean;
  saving: boolean;
  onSave: (draft: CareerPosition) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CareerPosition>(() =>
    structuredClone(initial),
  );
  const [errors, setErrors] = useState<string[]>([]);

  const patch = (partial: Partial<CareerPosition>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  function handleSave() {
    const problems: string[] = [];
    if (!draft.title.trim()) problems.push("Give the position a title.");
    setErrors(problems);
    if (problems.length > 0) return;
    onSave({ ...draft, title: draft.title.trim() });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New position" : `Edit: ${initial.title}`}
      width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create position" : "Save position"}
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
        <Field
          field={fd.text("title", "Title")}
          value={draft.title}
          onChange={(v) => patch({ title: String(v ?? "") })}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            field={fd.text("department", "Department")}
            value={draft.department}
            onChange={(v) => patch({ department: String(v ?? "") })}
          />
          <Field
            field={fd.text("location", "Location")}
            value={draft.location}
            onChange={(v) => patch({ location: String(v ?? "") })}
          />
          <Field
            field={fd.text("type", "Type", "e.g. Full-time, Contract")}
            value={draft.type}
            onChange={(v) => patch({ type: String(v ?? "") })}
          />
        </div>

        <Field
          field={fd.richtext(
            "description",
            "Description",
            "Responsibilities, requirements and how to apply.",
          )}
          value={draft.description}
          onChange={(v) => patch({ description: v as CareerPosition["description"] })}
        />

        <Field
          field={fd.boolean(
            "isOpen",
            "Open position",
            "Only open positions appear on the site.",
          )}
          value={draft.isOpen}
          onChange={(v) => patch({ isOpen: Boolean(v) })}
        />
      </div>
    </Drawer>
  );
}
