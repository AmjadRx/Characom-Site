"use client";

import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export interface FloatingTextareaProps
  extends React.ComponentPropsWithRef<"textarea"> {
  label: string;
  error?: string;
}

/**
 * Floating-label textarea — same behavior contract as FloatingInput:
 * rising label, 2px gold focus underline, inline aria-live error,
 * dark-context aware via an `.on-dark` ancestor. `className` styles the
 * wrapper; everything else passes to the native textarea.
 */
export default function FloatingTextarea({
  label,
  error,
  id,
  className,
  required,
  rows = 5,
  ...rest
}: FloatingTextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <textarea
          id={inputId}
          placeholder=" "
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "peer w-full resize-y appearance-none border-0 border-b bg-transparent px-0 pb-2.5 pt-5",
            "text-base leading-relaxed text-inherit outline-none transition-colors duration-300",
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
          className="pointer-events-none absolute inset-x-0 bottom-1.5 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 peer-focus:scale-x-100"
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

export { FloatingTextarea };
