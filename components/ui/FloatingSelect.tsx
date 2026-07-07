"use client";

import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export interface FloatingSelectProps
  extends React.ComponentPropsWithRef<"select"> {
  label: string;
  error?: string;
}

/**
 * Floating-label select. Because a select always shows a value, the label
 * stays floated (small, above the field); focus turns it gold and sweeps
 * the 2px underline, matching FloatingInput/FloatingTextarea. Options are
 * passed as children. `className` styles the wrapper.
 */
export default function FloatingSelect({
  label,
  error,
  id,
  className,
  required,
  children,
  ...rest
}: FloatingSelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <select
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "peer w-full cursor-pointer appearance-none border-0 border-b bg-transparent px-0 pb-2.5 pr-8 pt-5",
            "text-base text-inherit outline-none transition-colors duration-300",
            "border-ink/25",
            "[.on-dark_&]:border-white/25 [.on-dark_&]:[&>option]:text-ink",
            "aria-[invalid=true]:border-[#b3261e]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...rest}
        >
          {children}
        </select>
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-0 top-5 z-10 origin-[0] -translate-y-4 scale-75",
            "text-base text-stone transition-colors duration-300",
            "peer-focus:text-gold-deep [.on-dark_&]:peer-focus:text-gold-bright",
          )}
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        {/* chevron */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
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

export { FloatingSelect };
