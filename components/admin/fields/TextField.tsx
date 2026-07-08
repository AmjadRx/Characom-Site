"use client";

import { useId } from "react";
import { FieldShell, inputClass } from "./FieldShell";

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "password" | "tel";
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  help,
  placeholder,
  type = "text",
  autoComplete,
  disabled,
  className,
}: TextFieldProps) {
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : help ? helpId : undefined}
        className={inputClass(error)}
      />
    </FieldShell>
  );
}
