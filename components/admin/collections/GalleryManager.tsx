"use client";

/**
 * Project gallery manager — ordered editorial images with a layout hint
 * (full / half / offset), caption, and reorder controls (ARCHITECTURE §5.4).
 */

import type { GalleryLayout, ProjectImage } from "@/lib/content/types";
import {
  Field,
  IconButton,
  cardCls,
  fd,
  inputCls,
  labelCls,
  moveItem,
} from "./kit";
import { IconDown, IconPlus, IconTrash, IconUp } from "./icons";

const LAYOUT_OPTIONS: { label: string; value: GalleryLayout }[] = [
  { label: "Full bleed", value: "full" },
  { label: "Half width", value: "half" },
  { label: "Offset", value: "offset" },
];

const imageField = fd.image("image", "Image");

export default function GalleryManager({
  images,
  onChange,
}: {
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
}) {
  const update = (index: number, patch: Partial<ProjectImage>) =>
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));

  return (
    <fieldset>
      <legend className={labelCls}>Gallery</legend>
      {images.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink/20 px-4 py-5 text-center text-sm text-stone">
          No gallery images yet — the case study will show only the cover.
        </p>
      ) : (
        <ol className="space-y-3">
          {images.map((image, index) => (
            <li key={index} className={`${cardCls} p-4`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">
                  Image {index + 1} of {images.length}
                </span>
                <div className="flex items-center gap-1">
                  <IconButton
                    label={`Move image ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => onChange(moveItem(images, index, index - 1))}
                  >
                    <IconUp />
                  </IconButton>
                  <IconButton
                    label={`Move image ${index + 1} down`}
                    disabled={index === images.length - 1}
                    onClick={() => onChange(moveItem(images, index, index + 1))}
                  >
                    <IconDown />
                  </IconButton>
                  <IconButton
                    label={`Remove image ${index + 1}`}
                    tone="danger"
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                  >
                    <IconTrash />
                  </IconButton>
                </div>
              </div>

              <Field
                field={imageField}
                value={{ src: image.src, alt: image.alt }}
                onChange={(value) => {
                  const next = (value ?? {}) as { src?: string; alt?: string };
                  update(index, { src: next.src ?? "", alt: next.alt ?? "" });
                }}
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className={labelCls}
                    htmlFor={`gallery-layout-${index}`}
                  >
                    Layout
                  </label>
                  <select
                    id={`gallery-layout-${index}`}
                    value={image.layout}
                    className={inputCls}
                    onChange={(e) =>
                      update(index, { layout: e.target.value as GalleryLayout })
                    }
                  >
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={labelCls}
                    htmlFor={`gallery-caption-${index}`}
                  >
                    Caption (optional)
                  </label>
                  <input
                    id={`gallery-caption-${index}`}
                    type="text"
                    value={image.caption ?? ""}
                    className={inputCls}
                    onChange={(e) => update(index, { caption: e.target.value })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() =>
          onChange([...images, { src: "", alt: "", layout: "full", caption: "" }])
        }
        className="mt-3 inline-flex items-center gap-2 rounded-input px-2 py-1.5 text-sm font-semibold text-gold-deep hover:bg-gold/10"
      >
        <IconPlus />
        Add gallery image
      </button>
    </fieldset>
  );
}
