"use client";

import { useId } from "react";
import type { FieldDef } from "@/lib/blocks/defs";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { NumberField } from "./NumberField";
import { BooleanField } from "./BooleanField";
import { SelectField } from "./SelectField";
import { LinkField } from "./LinkField";
import { ImageField } from "./ImageField";
import {
  asBoolean,
  asImage,
  asLink,
  asNumber,
  asString,
  defaultItemFor,
} from "./coerce";

export interface ListFieldProps {
  label: string;
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  /** scalar-kind fields of each row (no nested lists) */
  itemFields: FieldDef[];
  /** singular label, e.g. "Milestone" */
  itemLabel?: string;
  error?: string;
  help?: string;
  className?: string;
}

/** Scalar sub-field dispatcher for one row property. */
function ItemField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
      return (
        <TextField label={field.label} help={field.help} value={asString(value)} onChange={onChange} />
      );
    case "textarea":
      return (
        <TextareaField label={field.label} help={field.help} rows={3} value={asString(value)} onChange={onChange} />
      );
    case "number":
      return (
        <NumberField label={field.label} help={field.help} value={asNumber(value)} onChange={onChange} />
      );
    case "boolean":
      return (
        <BooleanField label={field.label} help={field.help} value={asBoolean(value)} onChange={onChange} />
      );
    case "select":
      return (
        <SelectField
          label={field.label}
          help={field.help}
          options={field.options ?? []}
          value={asString(value) || (field.options?.[0]?.value ?? "")}
          onChange={onChange}
        />
      );
    case "link":
      return (
        <LinkField label={field.label} help={field.help} value={asLink(value)} onChange={onChange} />
      );
    case "image":
      return (
        <ImageField label={field.label} help={field.help} value={asImage(value)} onChange={onChange} />
      );
    default:
      // richtext / nested list inside rows is not supported by the contract.
      return (
        <p className="text-xs text-stone">
          Unsupported field kind “{field.kind}” inside a list.
        </p>
      );
  }
}

/** Generic repeatable-rows editor driven by FieldDef.itemFields. */
export function ListField({
  label,
  value,
  onChange,
  itemFields,
  itemLabel = "Item",
  error,
  help,
  className,
}: ListFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  const setRow = (index: number, row: Record<string, unknown>) => {
    onChange(value.map((item, i) => (i === index ? row : item)));
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  };

  const iconButton =
    "rounded p-1 text-stone transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-stone";

  return (
    <FieldShell
      label={label}
      as="fieldset"
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
      className={className}
    >
      <div className="space-y-3">
        {value.length === 0 && (
          <p className="rounded-input border border-dashed border-stone/40 px-3 py-4 text-center text-xs text-stone">
            No {itemLabel.toLowerCase()}s yet.
          </p>
        )}
        {value.map((row, index) => (
          <div
            key={index}
            className={cn(
              "rounded-input border bg-white/60 p-3",
              error ? "border-red-600/40" : "border-ink/10",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-ink/10 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone">
                {itemLabel} {index + 1}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}
                  className={iconButton}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19V5m-6 6 6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}
                  className={iconButton}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14m6-6-6 6-6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                  className="rounded p-1 text-stone transition-colors hover:text-red-700"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {itemFields.map((field) => (
                <ItemField
                  key={field.name}
                  field={field}
                  value={row[field.name]}
                  onChange={(v) => setRow(index, { ...row, [field.name]: v })}
                />
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, defaultItemFor(itemFields)])}
          className="inline-flex items-center gap-1.5 rounded-input border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add {itemLabel.toLowerCase()}
        </button>
      </div>
    </FieldShell>
  );
}
