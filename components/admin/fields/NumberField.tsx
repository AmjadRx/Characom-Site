"use client";

import { useEffect, useId, useState } from "react";
import { FieldShell, inputClass } from "./FieldShell";

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  error,
  help,
  min,
  max,
  step,
  className,
}: NumberFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  // Local draft so partial input ("-", "1.") doesn't snap back mid-typing.
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft((current) => (Number(current) === value ? current : String(value)));
  }, [value]);

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
        type="number"
        inputMode="decimal"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const parsed = Number(next);
          if (next.trim() !== "" && !Number.isNaN(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          if (draft.trim() === "" || Number.isNaN(Number(draft))) {
            setDraft(String(value));
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : help ? helpId : undefined}
        className={inputClass(error) + " tabular-nums"}
      />
    </FieldShell>
  );
}
