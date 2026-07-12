"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { FieldShell, inputClass } from "./FieldShell";

/** Matches linkSchema in lib/blocks/defs.ts. */
export interface LinkValue {
  label: string;
  href: string;
  variant: "gold" | "ghost" | "text";
  newTab: boolean;
}

export const EMPTY_LINK: LinkValue = {
  label: "",
  href: "/",
  variant: "gold",
  newTab: false,
};

export interface LinkFieldProps {
  label: string;
  value: LinkValue;
  onChange: (value: LinkValue) => void;
  error?: string;
  help?: string;
  className?: string;
}

const VARIANT_OPTIONS: { label: string; value: LinkValue["variant"] }[] = [
  { label: "Gold filled", value: "gold" },
  { label: "Ghost outline", value: "ghost" },
  { label: "Text link", value: "text" },
];

/** Grouped editor for a {label, href, variant, newTab} link/button prop. */
export function LinkField({
  label,
  value,
  onChange,
  error,
  help,
  className,
}: LinkFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const patch = (partial: Partial<LinkValue>) =>
    onChange({ ...EMPTY_LINK, ...value, ...partial });

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
      <div
        className={cn(
          "grid gap-3 rounded-input border bg-white/60 p-3 sm:grid-cols-2",
          error ? "border-red-600/40" : "border-ink/10",
        )}
      >
        <div>
          <label htmlFor={`${id}-label`} className="mb-1 block text-[11px] font-medium text-stone">
            Label
          </label>
          <input
            id={`${id}-label`}
            type="text"
            value={value.label}
            onChange={(e) => patch({ label: e.target.value })}
            className={inputClass()}
          />
        </div>
        <div>
          <label htmlFor={`${id}-href`} className="mb-1 block text-[11px] font-medium text-stone">
            Link (path or URL)
          </label>
          <input
            id={`${id}-href`}
            type="text"
            value={value.href}
            onChange={(e) => patch({ href: e.target.value })}
            placeholder="/contact"
            className={inputClass()}
          />
        </div>
        <div>
          <label htmlFor={`${id}-variant`} className="mb-1 block text-[11px] font-medium text-stone">
            Style
          </label>
          <select
            id={`${id}-variant`}
            value={value.variant}
            onChange={(e) => patch({ variant: e.target.value as LinkValue["variant"] })}
            className={inputClass() + " appearance-none"}
          >
            {VARIANT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={value.newTab}
              onChange={(e) => patch({ newTab: e.target.checked })}
              className="h-4 w-4 rounded-sm border-ink/30 accent-[var(--gold)]"
            />
            Open in new tab
          </label>
        </div>
      </div>
    </FieldShell>
  );
}
