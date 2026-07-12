import { cn } from "@/lib/utils";

/**
 * Shared chrome for admin form fields: label, help text and error message
 * (wired for aria-describedby by each field).
 */
export function FieldShell({
  label,
  htmlFor,
  help,
  helpId,
  error,
  errorId,
  children,
  className,
  as: Tag = "div",
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  helpId?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
  className?: string;
  as?: "div" | "fieldset";
}) {
  const labelEl =
    Tag === "fieldset" ? (
      <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
        {label}
      </legend>
    ) : (
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink/70"
      >
        {label}
      </label>
    );

  return (
    <Tag className={cn("min-w-0", Tag === "fieldset" && "border-0 p-0", className)}>
      {labelEl}
      {children}
      {help && !error && (
        <p id={helpId} className="mt-1.5 text-xs text-stone">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </Tag>
  );
}

/** Base input styling: plaster surface, ink text, gold focus underline. */
export function inputClass(error?: string): string {
  return cn(
    "w-full rounded-input border bg-plaster px-3 py-2 text-sm text-ink",
    "placeholder:text-stone/70 transition-[box-shadow,border-color] duration-150",
    "focus:shadow-[inset_0_-2px_0_0_var(--gold)]",
    error ? "border-red-600/60" : "border-ink/15 focus:border-ink/30",
  );
}
