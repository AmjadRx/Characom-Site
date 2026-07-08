"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { FieldShell, inputClass } from "./FieldShell";

export interface ImageValue {
  src: string;
  alt: string;
}

export const EMPTY_IMAGE: ImageValue = { src: "", alt: "" };

/**
 * Media library integration is intentionally loose (CONTRACTS.md): the media
 * library registers `window.__characomMediaPicker`; when present, a Browse
 * button appears. Accessed via a local cast (the media module owns the
 * global's declaration) so this file has no hard dependency on it.
 */
type MediaPickerFn = (onPick: (image: { src: string; alt: string }) => void) => void;

function getMediaPicker(): MediaPickerFn | undefined {
  if (typeof window === "undefined") return undefined;
  const picker = (window as unknown as { __characomMediaPicker?: unknown })
    .__characomMediaPicker;
  return typeof picker === "function" ? (picker as MediaPickerFn) : undefined;
}

export interface ImageFieldProps {
  label: string;
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  error?: string;
  help?: string;
  /** For string-only image props (logo, OG image) where alt is not stored. */
  hideAlt?: boolean;
  className?: string;
}

export function ImageField({
  label,
  value,
  onChange,
  error,
  help,
  hideAlt = false,
  className,
}: ImageFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const [hasPicker, setHasPicker] = useState(false);

  // The media library registers its picker after mount — re-check briefly.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const check = () => {
      if (cancelled) return;
      if (getMediaPicker()) {
        setHasPicker(true);
        return;
      }
      attempts += 1;
      if (attempts < 8) window.setTimeout(check, 400);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (partial: Partial<ImageValue>) =>
    onChange({ ...EMPTY_IMAGE, ...value, ...partial });

  const browse = () => {
    getMediaPicker()?.((image) => {
      onChange({ src: image.src, alt: hideAlt ? value.alt : image.alt });
    });
  };

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
          "rounded-input border bg-white/60 p-3",
          error ? "border-red-600/40" : "border-ink/10",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Preview — arbitrary sources (unsplash, /api/media), so plain img */}
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-input border border-ink/10 bg-plaster">
            {value.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.src}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="1.5" />
                  <path d="m5 19 5.5-5.5 3 3L17 13l4 4" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <label htmlFor={`${id}-src`} className="mb-1 block text-[11px] font-medium text-stone">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  id={`${id}-src`}
                  type="text"
                  value={value.src}
                  onChange={(e) => patch({ src: e.target.value })}
                  placeholder="/api/media/… or https://…"
                  aria-invalid={error ? true : undefined}
                  className={inputClass(error)}
                />
                {hasPicker && (
                  <button
                    type="button"
                    onClick={browse}
                    className="shrink-0 rounded-input border border-ink/20 px-3 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/5"
                  >
                    Browse…
                  </button>
                )}
              </div>
            </div>
            {!hideAlt && (
              <div>
                <label htmlFor={`${id}-alt`} className="mb-1 block text-[11px] font-medium text-stone">
                  Alt text (describe the image)
                </label>
                <input
                  id={`${id}-alt`}
                  type="text"
                  value={value.alt}
                  onChange={(e) => patch({ alt: e.target.value })}
                  className={inputClass()}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </FieldShell>
  );
}
