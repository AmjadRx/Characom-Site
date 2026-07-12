"use client";

/**
 * Builder left pane — vertically sortable section list (dnd-kit).
 * Drag handle, visibility toggle, duplicate, delete; click row to select.
 */

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_DEFS, type BlockType } from "@/lib/blocks/defs";
import type { Section } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/admin/collections/kit";
import {
  IconCopy,
  IconEye,
  IconEyeOff,
  IconGrip,
  IconPlus,
  IconTrash,
  IconWarning,
} from "@/components/admin/collections/icons";

function sectionHint(section: Section): string {
  const props = section.props;
  for (const key of ["heading", "headline", "kicker", "title"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export default function SectionList({
  sections,
  selectedId,
  issues,
  onSelect,
  onReorder,
  onToggleVisible,
  onDuplicate,
  onDelete,
  onAdd,
}: {
  sections: Section[];
  selectedId: string | null;
  issues: Record<string, string[]>;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleVisible: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <nav aria-label="Page sections">
      {sections.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-stone">
          No sections yet. Add your first block below.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1.5">
              {sections.map((section, index) => (
                <SortableSectionRow
                  key={section.id}
                  section={section}
                  index={index}
                  selected={section.id === selectedId}
                  hasIssues={Boolean(issues[section.id]?.length)}
                  onSelect={() => onSelect(section.id)}
                  onToggleVisible={() => onToggleVisible(section.id)}
                  onDuplicate={() => onDuplicate(section.id)}
                  onDelete={() => onDelete(section.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-3">
        <Button variant="ghost" onClick={onAdd} className="w-full">
          <span className="inline-flex items-center gap-2">
            <IconPlus />
            Add block
          </span>
        </Button>
      </div>
    </nav>
  );
}

function SortableSectionRow({
  section,
  index,
  selected,
  hasIssues,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onDelete,
}: {
  section: Section;
  index: number;
  selected: boolean;
  hasIssues: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const def = BLOCK_DEFS[section.type as BlockType];
  const label = def?.label ?? section.type;
  const hint = sectionHint(section);

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group rounded-card border bg-white",
        selected ? "border-gold shadow-sm" : "border-ink/10",
        isDragging && "z-10 shadow-lg",
        !section.visible && "opacity-60",
      )}
    >
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${label} (position ${index + 1})`}
          className="inline-flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-input text-stone hover:bg-ink/5 hover:text-ink active:cursor-grabbing"
        >
          <IconGrip />
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
          className="min-w-0 flex-1 rounded-input px-1.5 py-1 text-left"
        >
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-sm font-medium",
                selected ? "text-gold-deep" : "text-ink",
              )}
            >
              {label}
            </span>
            {hasIssues ? (
              <span
                className="text-red-700"
                title="This block has validation issues"
              >
                <IconWarning width={13} height={13} />
                <span className="sr-only">Has validation issues</span>
              </span>
            ) : null}
          </span>
          {hint ? (
            <span className="block truncate text-xs text-stone">{hint}</span>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center opacity-100 lg:opacity-0 lg:transition-opacity lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <IconButton
            label={
              section.visible
                ? `Hide ${label} on the site`
                : `Show ${label} on the site`
            }
            pressed={!section.visible}
            onClick={onToggleVisible}
          >
            {section.visible ? <IconEye /> : <IconEyeOff />}
          </IconButton>
          <IconButton label={`Duplicate ${label}`} onClick={onDuplicate}>
            <IconCopy />
          </IconButton>
          <IconButton
            label={`Delete ${label}`}
            tone="danger"
            onClick={onDelete}
          >
            <IconTrash />
          </IconButton>
        </div>
      </div>
    </li>
  );
}
