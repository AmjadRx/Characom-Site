"use client";

/**
 * admin-content shared kit.
 *
 * Every admin-content screen (pages, builder, projects, categories, news,
 * careers, media, navigation) imports admin-core's shared modules THROUGH
 * this file, so any contract drift between the two areas is reconciled in
 * exactly one place. It also provides the small primitives those screens
 * share: drawer, confirm dialog, status chip, unsaved-changes guard,
 * collection query/save hooks and consistent input styling.
 */

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { FieldDef, FieldOption } from "@/lib/blocks/defs";
import { cn } from "@/lib/utils";
// ── admin-core contract imports (owner: admin-core, per docs/CONTRACTS.md) ──
import { adminGet, adminSend, uploadMedia } from "@/components/admin/api";
import { renderField } from "@/components/admin/fields";
import {
  Button,
  EmptyState,
  Modal,
  Spinner,
  useToast,
} from "@/components/admin/ui";
import { IconImage, IconX } from "./icons";

export { Button, EmptyState, Modal, Spinner, uploadMedia };

/* ── API helpers (all admin-content fetches go through these two) ───────── */

/** GET /api/admin/<path> */
export function getJson<T>(path: string): Promise<T> {
  return adminGet<T>(path);
}

/** Mutating call to /api/admin/<path>. */
export function sendJson<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  return adminSend<T>(path, method, body);
}

export function errMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

/* ── Toasts ──────────────────────────────────────────────────────────────── */

export type NotifyFn = (message: string, kind?: "success" | "error") => void;

/** Thin wrapper over admin-core's toast hook. */
export function useNotify(): NotifyFn {
  const { toast } = useToast();
  return useCallback<NotifyFn>(
    (message, kind = "success") => toast(message, kind),
    [toast],
  );
}

/* ── Auto-generated fields (admin-core renderField dispatcher) ──────────── */

/**
 * Single call-site wrapper around admin-core's `renderField` so a signature
 * change is a one-line fix here rather than in every form.
 */
export function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  return <div data-field={field.name}>{renderField(field, value, onChange)}</div>;
}

/** Terse FieldDef builders for hand-assembled collection forms. */
export const fd = {
  text: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "text",
    help,
  }),
  textarea: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "textarea",
    help,
  }),
  richtext: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "richtext",
    help,
  }),
  image: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "image",
    help,
  }),
  number: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "number",
    help,
  }),
  boolean: (name: string, label: string, help?: string): FieldDef => ({
    name,
    label,
    kind: "boolean",
    help,
  }),
  select: (
    name: string,
    label: string,
    options: FieldOption[],
    help?: string,
  ): FieldDef => ({ name, label, kind: "select", options, help }),
  list: (
    name: string,
    label: string,
    itemLabel: string,
    itemFields: FieldDef[],
    help?: string,
  ): FieldDef => ({ name, label, kind: "list", itemLabel, itemFields, help }),
};

/* ── Query helpers for whole-collection GET/PUT endpoints ───────────────── */

export function useAdminList<T>(key: string): UseQueryResult<T> {
  return useQuery<T>({
    queryKey: ["admin", key],
    queryFn: () => getJson<T>(key),
  });
}

/** PUT the whole collection back, invalidate, toast. */
export function useSaveList<T>(
  key: string,
  savedMessage: string,
): UseMutationResult<T, Error, T> {
  const queryClient = useQueryClient();
  const notify = useNotify();
  return useMutation<T, Error, T>({
    mutationFn: (items: T) => sendJson<T>(key, "PUT", items),
    onSuccess: (saved) => {
      queryClient.setQueryData(["admin", key], saved);
      queryClient.invalidateQueries({ queryKey: ["admin", key] });
      notify(savedMessage, "success");
    },
    onError: (err) => notify(errMessage(err), "error"),
  });
}

/* ── Styling constants (admin visual language: plaster canvas, ink text) ── */

export const inputCls =
  "w-full rounded-input border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-gold focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-stone";

export const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone";

export const helpCls = "mt-1.5 text-xs leading-relaxed text-stone";

export const cardCls = "rounded-card border border-ink/10 bg-white";

export const thCls =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-stone";

export const tdCls = "px-4 py-3 text-sm text-ink align-middle";

/* ── Screen scaffolding ─────────────────────────────────────────────────── */

export function ScreenHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}

export function LoadingRow({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 py-16 justify-center text-sm text-stone"
      role="status"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNote({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p>{errMessage(error)}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-semibold underline underline-offset-2"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

/* ── Status chip (domain-specific, self-styled) ─────────────────────────── */

const POSITIVE_STATUSES = new Set(["published", "open", "completed"]);

export function StatusChip({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const positive = POSITIVE_STATUSES.has(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        positive ? "bg-cypress/10 text-cypress" : "bg-stone/15 text-stone",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          positive ? "bg-cypress" : "bg-stone",
        )}
      />
      {label ?? value.replace(/_/g, " ")}
    </span>
  );
}

/* ── Icon button ────────────────────────────────────────────────────────── */

export function IconButton({
  label,
  onClick,
  children,
  tone = "default",
  disabled,
  pressed,
  className,
}: {
  label: string;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  tone?: "default" | "danger" | "gold";
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        tone === "default" && "text-stone hover:bg-ink/5 hover:text-ink",
        tone === "danger" && "text-stone hover:bg-red-50 hover:text-red-700",
        tone === "gold" && "text-gold-deep hover:bg-gold/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Media thumbnail (plain img — admin-only, arbitrary sources) ────────── */

export function Thumb({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center bg-ink/5 text-stone",
          className,
        )}
      >
        <IconImage />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />
  );
}

/* ── Confirm dialog (built on admin-core Modal) ─────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "Delete",
  danger = true,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  /** highlighted warning line, e.g. referenced-content caution */
  detail?: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-relaxed text-ink/80">{message}</p>
      {detail ? (
        <p className="mt-3 rounded-input border border-gold/40 bg-gold/10 px-3 py-2 text-sm leading-relaxed text-gold-deep">
          {detail}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ── Drawer (right-side editor panel, focus-trapped) ────────────────────── */

/** Stack of open drawers so only the top-most one handles Esc / Tab. */
const drawerStack: symbol[] = [];
let scrollLocks = 0;

function lockScroll() {
  scrollLocks += 1;
  if (scrollLocks === 1) document.body.style.overflow = "hidden";
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = "";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = "lg",
  layer = "base",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg" | "xl";
  /** "top" renders above another open drawer (e.g. media picker). */
  layer?: "base" | "top";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const token = Symbol("drawer");
    drawerStack.push(token);
    lockScroll();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (drawerStack[drawerStack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const i = drawerStack.indexOf(token);
      if (i !== -1) drawerStack.splice(i, 1);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0", layer === "top" ? "z-[70]" : "z-50")}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-ink/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-full flex-col bg-plaster shadow-2xl outline-none",
          width === "md" && "max-w-md",
          width === "lg" && "max-w-2xl",
          width === "xl" && "max-w-4xl",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 bg-white px-6 py-4">
          <h2 className="min-w-0 truncate font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          <IconButton label="Close panel" onClick={onClose}>
            <IconX />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-ink/10 bg-white px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Unsaved-changes guard ──────────────────────────────────────────────── */

/**
 * beforeunload guard + best-effort in-app link interception while `dirty`.
 * App Router has no route events, so we capture link clicks and confirm.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      if (
        !window.confirm(
          "You have unsaved changes. Leave this page and discard them?",
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [dirty]);
}

/* ── Small data helpers ─────────────────────────────────────────────────── */

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function commaToTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export const PAGE_SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const SIMPLE_SLUG_RE = /^[a-z0-9-]+$/;
