import { cn } from "@/lib/utils";

/** Dashed placeholder card for empty collections. */
export function EmptyState({
  title,
  text,
  action,
  className,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-stone/40 bg-white/60 px-6 py-12 text-center",
        className,
      )}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-stone"
      >
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path d="M8 14h8M9 9.5h.01M15 9.5h.01" />
      </svg>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {text && <p className="max-w-sm text-sm text-stone">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
