"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Inquiry, InquiryStatus, InquirySubject } from "@/lib/content/types";
import { adminGet, adminSend } from "@/components/admin/api";
import { cn } from "@/lib/utils";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers/ReducedMotionProvider";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Spinner,
  useToast,
} from "@/components/admin/ui";
import type { BadgeTone } from "@/components/admin/ui";

const EASE_OUT_HARD: [number, number, number, number] = [...EASE_FM.outHard];

type Tab = "all" | InquiryStatus;

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONE: Record<InquiryStatus, BadgeTone> = {
  new: "gold",
  read: "neutral",
  replied: "green",
  archived: "ink",
};

const SUBJECT_TONE: Record<InquirySubject, BadgeTone> = {
  general: "neutral",
  project: "gold",
  partnership: "green",
  careers: "blue",
};

const SUBJECT_LABEL: Record<InquirySubject, string> = {
  general: "General",
  project: "Project",
  partnership: "Partnership",
  careers: "Careers",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function exportCsv(rows: Inquiry[], tab: Tab): void {
  const header = [
    "id",
    "created_at",
    "status",
    "subject",
    "name",
    "email",
    "phone",
    "source_page",
    "message",
  ];
  const lines = [
    header.join(","),
    ...rows.map((i) =>
      [
        i.id,
        i.createdAt,
        i.status,
        i.subjectType,
        i.name,
        i.email,
        i.phone ?? "",
        i.sourcePage,
        i.message,
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    ),
  ];
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `characom-inquiries-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── Detail drawer ─────────────────────────────────────────────────────── */

function InquiryDrawer({
  inquiry,
  onClose,
  onSetStatus,
  updating,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSetStatus: (status: InquiryStatus) => void;
  updating: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { reduced } = useReducedMotionPref();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mailto = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: your ${SUBJECT_LABEL[inquiry.subjectType].toLowerCase()} inquiry — Characom Group`,
  )}`;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-ink/50"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`Inquiry from ${inquiry.name}`}
        initial={reduced ? { opacity: 0 } : { x: "100%" }}
        animate={reduced ? { opacity: 1 } : { x: 0 }}
        transition={{ duration: DUR.fast, ease: EASE_OUT_HARD }}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SUBJECT_TONE[inquiry.subjectType]}>
                {SUBJECT_LABEL[inquiry.subjectType]}
              </Badge>
              <Badge tone={STATUS_TONE[inquiry.status]}>{inquiry.status}</Badge>
            </div>
            <h2 className="mt-2 truncate font-display text-lg font-semibold text-ink">
              {inquiry.name}
            </h2>
            <p className="text-xs text-stone">
              {formatWhen(inquiry.createdAt)} · from {inquiry.sourcePage || "—"}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded p-1 text-stone transition-colors hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-stone">
                Email
              </dt>
              <dd>
                <a href={`mailto:${inquiry.email}`} className="link-underline text-aegean">
                  {inquiry.email}
                </a>
              </dd>
            </div>
            {inquiry.phone && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-stone">
                  Phone
                </dt>
                <dd className="text-ink">{inquiry.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-stone">
                Message
              </dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-input border border-ink/10 bg-plaster px-3 py-2.5 leading-relaxed text-ink">
                {inquiry.message}
              </dd>
            </div>
            {inquiry.repliedAt && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-stone">
                  Replied
                </dt>
                <dd className="text-ink">{formatWhen(inquiry.repliedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-3 border-t border-ink/10 px-6 py-4">
          <a
            href={mailto}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-input bg-gold px-5 text-sm font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
            Reply by email
          </a>
          <div
            role="group"
            aria-label="Set status"
            className="grid grid-cols-4 gap-1.5"
          >
            {(["new", "read", "replied", "archived"] as InquiryStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updating || inquiry.status === status}
                  onClick={() => onSetStatus(status)}
                  aria-pressed={inquiry.status === status}
                  className={cn(
                    "rounded-input border px-1 py-1.5 text-[11px] font-semibold capitalize transition-colors disabled:cursor-default",
                    inquiry.status === status
                      ? "border-gold-deep bg-gold/20 text-gold-deep"
                      : "border-ink/15 text-ink/70 hover:border-ink/35 hover:text-ink disabled:opacity-50",
                  )}
                >
                  {status}
                </button>
              ),
            )}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function InquiriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: inquiries = [], isLoading, error } = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => adminGet<Inquiry[]>("inquiries"),
  });

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: inquiries.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };
    for (const inquiry of inquiries) c[inquiry.status] += 1;
    return c;
  }, [inquiries]);

  const filtered =
    tab === "all" ? inquiries : inquiries.filter((i) => i.status === tab);
  const selected = inquiries.find((i) => i.id === openId) ?? null;

  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: InquiryStatus }) =>
      adminSend<Inquiry>("inquiries", "PATCH", input),
    onSuccess: (updated) => {
      queryClient.setQueryData<Inquiry[]>(["inquiries"], (old = []) =>
        old.map((i) => (i.id === updated.id ? updated : i)),
      );
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const openInquiry = (inquiry: Inquiry) => {
    setOpenId(inquiry.id);
    // Opening an unread inquiry marks it read.
    if (inquiry.status === "new") {
      setStatus.mutate({ id: inquiry.id, status: "read" });
    }
  };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Contact and partner form submissions from the public site."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsv(filtered, tab)}
            disabled={filtered.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11m0 0 -4-4m4 4 4-4M4 19.5h16" />
            </svg>
            Export CSV
          </Button>
        }
      />

      {/* Status tabs */}
      <div
        role="group"
        aria-label="Filter by status"
        className="mb-5 flex flex-wrap gap-1.5"
      >
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              tab === value
                ? "border-ink bg-ink text-plaster"
                : "border-ink/15 bg-white text-ink/70 hover:border-ink/35 hover:text-ink",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-pill px-1.5 py-0.5 text-[10px] tabular-nums",
                tab === value ? "bg-gold text-ink" : "bg-ink/5 text-stone",
              )}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Could not load inquiries" text={(error as Error).message} />
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-stone">
          <Spinner size={18} /> Loading inquiries…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tab === "all" ? "No inquiries yet" : `No ${tab} inquiries`}
          text={
            tab === "all"
              ? "Submissions from the contact and partner forms will land here."
              : "Nothing with this status right now."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-ink/10 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-[0.1em] text-stone">
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Message</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((inquiry) => (
                <tr
                  key={inquiry.id}
                  onClick={() => openInquiry(inquiry)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-plaster",
                    inquiry.status === "new" && "bg-gold/[0.04]",
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-stone">
                    {formatWhen(inquiry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={SUBJECT_TONE[inquiry.subjectType]}>
                      {SUBJECT_LABEL[inquiry.subjectType]}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "max-w-[10rem] truncate px-4 py-3",
                      inquiry.status === "new" ? "font-semibold text-ink" : "text-ink",
                    )}
                  >
                    {inquiry.name}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-stone">
                    {inquiry.email}
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-stone">
                    {inquiry.message}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInquiry(inquiry);
                      }}
                      aria-label={`Open inquiry from ${inquiry.name}`}
                      className="link-underline text-xs font-semibold text-ink/70 hover:text-ink"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <InquiryDrawer
            inquiry={selected}
            onClose={() => setOpenId(null)}
            updating={setStatus.isPending}
            onSetStatus={(status) => setStatus.mutate({ id: selected.id, status })}
          />
        )}
      </AnimatePresence>
    </>
  );
}
