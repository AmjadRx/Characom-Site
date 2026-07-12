"use client";

/**
 * /admin/navigation — header tree (2 levels), footer columns 1–3 with
 * titles, and social links. dnd-kit reordering within each list; a single
 * Save writes the whole NavigationData back (contract).
 */

import { useEffect, useRef, useState } from "react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  NavMenu,
  NavigationData,
  NavigationItem,
} from "@/lib/content/types";
import { cn, newId } from "@/lib/utils";
import {
  Button,
  ErrorNote,
  IconButton,
  LoadingRow,
  ScreenHeader,
  cardCls,
  helpCls,
  inputCls,
  labelCls,
  useAdminList,
  useSaveList,
  useUnsavedGuard,
} from "./kit";
import {
  IconChevronDown,
  IconChevronRight,
  IconGrip,
  IconPlus,
  IconTrash,
} from "./icons";

function newNavItem(menu: NavMenu, sortOrder: number): NavigationItem {
  return {
    id: newId("nav"),
    menu,
    label: "",
    href: "/",
    newTab: false,
    sortOrder,
    ...(menu === "header" ? { children: [] } : {}),
  };
}

/** Reindex sortOrder and stamp the menu on every item before saving. */
function normalize(nav: NavigationData): NavigationData {
  const fix = (
    items: NavigationItem[],
    menu: NavMenu,
    withChildren: boolean,
  ): NavigationItem[] =>
    items.map((item, i) => ({
      ...item,
      menu,
      sortOrder: i,
      children: withChildren
        ? (item.children ?? []).map((child, j) => ({
            ...child,
            menu,
            sortOrder: j,
            children: undefined,
          }))
        : undefined,
    }));
  return {
    header: fix(nav.header, "header", true),
    footer_1: fix(nav.footer_1, "footer_1", false),
    footer_2: fix(nav.footer_2, "footer_2", false),
    footer_3: fix(nav.footer_3, "footer_3", false),
    social: fix(nav.social, "social", false),
    footerColumnTitles: { ...nav.footerColumnTitles },
  };
}

const FOOTER_COLUMNS: { key: "footer_1" | "footer_2" | "footer_3" }[] = [
  { key: "footer_1" },
  { key: "footer_2" },
  { key: "footer_3" },
];

export default function NavigationScreen() {
  const navQuery = useAdminList<NavigationData>("navigation");
  const saveList = useSaveList<NavigationData>("navigation", "Navigation saved.");

  const [working, setWorking] = useState<NavigationData | null>(null);
  const [dirty, setDirty] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!navQuery.data || loadedRef.current) return;
    loadedRef.current = true;
    setWorking(structuredClone(navQuery.data));
  }, [navQuery.data]);

  useUnsavedGuard(dirty);

  const patch = (partial: Partial<NavigationData>) => {
    setWorking((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  };

  const handleSave = () => {
    if (!working) return;
    saveList.mutate(normalize(working), {
      onSuccess: (saved) => {
        setWorking(structuredClone(saved));
        setDirty(false);
      },
    });
  };

  if (navQuery.isLoading || !working) {
    if (navQuery.error) {
      return (
        <ErrorNote error={navQuery.error} onRetry={() => void navQuery.refetch()} />
      );
    }
    return <LoadingRow label="Loading navigation…" />;
  }

  return (
    <div>
      <ScreenHeader
        title="Navigation"
        description="Header menu (two levels), footer columns and social links. Drag to reorder — changes go live when you save."
        actions={
          <>
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-deep">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-gold"
                  aria-hidden="true"
                />
                Unsaved changes
              </span>
            ) : null}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saveList.isPending || !dirty}
            >
              {saveList.isPending ? "Saving…" : "Save navigation"}
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* Header menu */}
        <section className={`${cardCls} p-5`} aria-label="Header menu">
          <h2 className="font-display text-base font-semibold text-ink">
            Header menu
          </h2>
          <p className={`${helpCls} mb-4`}>
            Keep it focused — five or six top-level items. Sub-items appear in
            the fullscreen menu.
          </p>
          <NavItemList
            items={working.header}
            menu="header"
            allowChildren
            listLabel="Header menu items"
            onChange={(items) => patch({ header: items })}
          />
        </section>

        {/* Footer columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {FOOTER_COLUMNS.map(({ key }, index) => (
            <section
              key={key}
              className={`${cardCls} p-5`}
              aria-label={`Footer column ${index + 1}`}
            >
              <label className={labelCls} htmlFor={`nav-col-title-${key}`}>
                Column {index + 1} title
              </label>
              <input
                id={`nav-col-title-${key}`}
                type="text"
                value={working.footerColumnTitles[key]}
                className={`${inputCls} mb-4`}
                onChange={(e) =>
                  patch({
                    footerColumnTitles: {
                      ...working.footerColumnTitles,
                      [key]: e.target.value,
                    },
                  })
                }
              />
              <NavItemList
                items={working[key]}
                menu={key}
                listLabel={`Footer column ${index + 1} links`}
                onChange={(items) => patch({ [key]: items } as Partial<NavigationData>)}
              />
            </section>
          ))}
        </div>

        {/* Social links */}
        <section className={`${cardCls} p-5`} aria-label="Social links">
          <h2 className="font-display text-base font-semibold text-ink">
            Social links
          </h2>
          <p className={`${helpCls} mb-4`}>
            Shown in the footer and the fullscreen menu. Use full URLs.
          </p>
          <NavItemList
            items={working.social}
            menu="social"
            listLabel="Social links"
            hrefHint="Full URL, e.g. https://www.linkedin.com/company/characom"
            onChange={(items) => patch({ social: items })}
          />
        </section>
      </div>
    </div>
  );
}

/* ── Sortable item list (one DndContext per list) ───────────────────────── */

function NavItemList({
  items,
  menu,
  onChange,
  allowChildren = false,
  listLabel,
  hrefHint = "Internal path (e.g. /portfolio, /about) or a full URL.",
}: {
  items: NavigationItem[];
  menu: NavMenu;
  onChange: (items: NavigationItem[]) => void;
  allowChildren?: boolean;
  listLabel: string;
  hrefHint?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === String(active.id));
    const to = items.findIndex((i) => i.id === String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(items, from, to));
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink/20 px-4 py-4 text-center text-sm text-stone">
          No items yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1.5" aria-label={listLabel}>
              {items.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  allowChildren={allowChildren}
                  hrefHint={hrefHint}
                  onChange={(next) =>
                    onChange(items.map((i) => (i.id === item.id ? next : i)))
                  }
                  onDelete={() =>
                    onChange(items.filter((i) => i.id !== item.id))
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => onChange([...items, newNavItem(menu, items.length)])}
        className="mt-2 inline-flex items-center gap-2 rounded-input px-2 py-1.5 text-sm font-semibold text-gold-deep hover:bg-gold/10"
      >
        <IconPlus />
        Add item
      </button>
    </div>
  );
}

/* ── Single row with inline editor + optional children list ────────────── */

function NavRow({
  item,
  allowChildren,
  hrefHint,
  onChange,
  onDelete,
}: {
  item: NavigationItem;
  allowChildren: boolean;
  hrefHint: string;
  onChange: (item: NavigationItem) => void;
  onDelete: () => void;
}) {
  // New (blank) items start expanded so they can be filled in immediately.
  const [open, setOpen] = useState(item.label === "");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const children = item.children ?? [];
  const displayLabel = item.label || "Untitled item";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-card border border-ink/10 bg-white",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder “${displayLabel}”`}
          className="inline-flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-input text-stone hover:bg-ink/5 hover:text-ink active:cursor-grabbing"
        >
          <IconGrip />
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-input px-1.5 py-1 text-left"
        >
          <span className="text-stone" aria-hidden="true">
            {open ? <IconChevronDown /> : <IconChevronRight />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {displayLabel}
            </span>
            <span className="block truncate text-xs text-stone">
              {item.href}
              {allowChildren && children.length > 0
                ? ` · ${children.length} sub-item${children.length === 1 ? "" : "s"}`
                : ""}
            </span>
          </span>
        </button>

        <IconButton
          label={`Delete “${displayLabel}”`}
          tone="danger"
          onClick={onDelete}
        >
          <IconTrash />
        </IconButton>
      </div>

      {open ? (
        <div className="border-t border-ink/10 px-3.5 py-3.5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor={`nav-label-${item.id}`}>
                Label
              </label>
              <input
                id={`nav-label-${item.id}`}
                type="text"
                value={item.label}
                className={inputCls}
                onChange={(e) => onChange({ ...item, label: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`nav-href-${item.id}`}>
                Link
              </label>
              <input
                id={`nav-href-${item.id}`}
                type="text"
                value={item.href}
                className={inputCls}
                onChange={(e) => onChange({ ...item, href: e.target.value })}
              />
              <p className={helpCls}>{hrefHint}</p>
            </div>
          </div>

          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={item.newTab}
              className="h-4 w-4 accent-[var(--gold)]"
              onChange={(e) => onChange({ ...item, newTab: e.target.checked })}
            />
            Open in a new tab
          </label>

          {allowChildren ? (
            <div className="mt-4 border-t border-ink/10 pt-4">
              <p className={labelCls}>Sub-items</p>
              <NavItemList
                items={children}
                menu={item.menu}
                listLabel={`Sub-items of “${displayLabel}”`}
                hrefHint={hrefHint}
                onChange={(next) => onChange({ ...item, children: next })}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
