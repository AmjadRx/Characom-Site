"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface BooleanFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  help?: string;
  className?: string;
}

/** Accessible switch (role="switch") with a gold "on" state. */
export function BooleanField({
  label,
  value,
  onChange,
  error,
  help,
  className,
}: BooleanFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70"
        >
          {label}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={value}
          aria-describedby={error ? errorId : help ? helpId : undefined}
          onClick={() => onChange(!value)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-150",
            value
              ? "border-gold-deep bg-gold"
              : "border-ink/20 bg-stone/25",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-pill bg-white shadow transition-transform duration-150",
              value ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
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
    </div>
  );
}
