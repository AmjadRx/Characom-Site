"use client";

import { useId } from "react";
import { FieldShell, inputClass } from "./FieldShell";

export interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextareaField({
  label,
  value,
  onChange,
  error,
  help,
  placeholder,
  rows = 4,
  className,
}: TextareaFieldProps) {
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
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : help ? helpId : undefined}
        className={inputClass(error)}
      />
    </FieldShell>
  );
}
