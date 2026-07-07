"use client";

import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps
  extends React.ComponentPropsWithRef<"input"> {
  label: string;
  error?: string;
}

/**
 * Floating-label text input (CONTRACTS.md — components/ui).
 * The label rests inside the field and rises when focused/filled; a 2px gold
 * underline sweeps in on focus. Errors render inline (aria-live polite) and
 * set aria-invalid/aria-describedby. Dark-context aware via an `.on-dark`
 * ancestor class. `className` styles the field wrapper (for grid spans);
 * all other props pass through to the native input (react-hook-form ready).
 */
export default function FloatingInput({
  label,
  error,
  id,
  className,
  required,
  ...rest
}: FloatingInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          id={inputId}
          placeholder=" "
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "peer w-full appearance-none border-0 border-b bg-transparent px-0 pb-2.5 pt-5",
            "text-base text-inherit outline-none transition-colors duration-300",
            "border-ink/25 placeholder:text-transparent",
            "[.on-dark_&]:border-white/25",
            "aria-[invalid=true]:border-[#b3261e]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-0 top-5 z-10 origin-[0] -translate-y-4 scale-75",
            "text-base text-stone transition-transform duration-300",
            "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
            "peer-focus:-translate-y-4 peer-focus:scale-75",
            "peer-focus:text-gold-deep [.on-dark_&]:peer-focus:text-gold-bright",
          )}
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        {/* 2px gold focus underline (transform-only animation) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 peer-focus:scale-x-100"
        />
      </div>
      <p
        id={errorId}
        aria-live="polite"
        className="mt-1.5 min-h-[1.25rem] text-[0.8125rem] leading-snug text-[#b3261e] [.on-dark_&]:text-[#ffb4a9]"
      >
        {error}
      </p>
    </div>
  );
}

export { FloatingInput };
