"use client";

import { useId } from "react";
import type { FieldOption } from "@/lib/blocks/defs";
import { FieldShell, inputClass } from "./FieldShell";

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
  error?: string;
  help?: string;
  className?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  help,
  className,
}: SelectFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
      className={className}
    >
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : help ? helpId : undefined}
          className={inputClass(error) + " appearance-none pr-9"}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </FieldShell>
  );
}
