import { cn } from "@/lib/utils";

export type BadgeTone = "gold" | "neutral" | "green" | "blue" | "red" | "ink";

const TONES: Record<BadgeTone, string> = {
  gold: "bg-gold/15 text-gold-deep border-gold/30",
  neutral: "bg-stone/10 text-ink/70 border-stone/30",
  green: "bg-cypress/10 text-cypress border-cypress/30",
  blue: "bg-aegean/10 text-aegean border-aegean/30",
  red: "bg-red-600/10 text-red-700 border-red-600/30",
  ink: "bg-ink text-plaster border-ink",
};

/** Small status chip. */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
