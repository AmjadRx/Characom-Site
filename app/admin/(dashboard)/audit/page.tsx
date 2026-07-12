"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditEntry } from "@/lib/content/types";
import { adminGet } from "@/components/admin/api";
import {
  Badge,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/admin/ui";
import type { BadgeTone } from "@/components/admin/ui";

const ACTION_TONE: Record<AuditEntry["action"], BadgeTone> = {
  create: "green",
  update: "neutral",
  delete: "red",
  publish: "gold",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditPage() {
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["audit"],
    queryFn: () => adminGet<AuditEntry[]>("audit"),
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, newest first. The log keeps the 300 most recent entries; full history lives in the git commit log."
      />

      {error ? (
        <EmptyState title="Could not load the audit log" text={(error as Error).message} />
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-stone">
          <Spinner size={18} /> Loading audit log…
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No entries yet"
          text="Changes made through the admin will be recorded here."
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-ink/10 bg-white">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-[0.1em] text-stone">
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-plaster">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-stone">
                    {formatWhen(entry.at)}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-ink" title={entry.actor}>
                    {entry.actor}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ACTION_TONE[entry.action] ?? "neutral"}>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <span className="font-medium">{entry.entity}</span>
                    {entry.entityId && entry.entityId !== entry.entity && (
                      <span className="text-stone"> · {entry.entityId}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
