"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/content/types";
import Lightbox from "@/components/ui/Lightbox";
import { Reveal } from "@/components/motion";
import { STAGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";

/**
 * Editorial case-study gallery (ARCHITECTURE §5.4).
 * Honors per-image layout hints: "full" = edge-to-edge, "half" = paired
 * two-up, "offset" = 3/5-width pushed to alternating sides. Every image
 * reveals via clip-path (Reveal variant "clip") and opens the shared
 * Lightbox on click (focus-trapped, keyboard navigable).
 */

interface GalleryRow {
  kind: "full" | "half" | "offset";
  items: { image: ProjectImage; index: number }[];
}

function buildRows(images: ProjectImage[]): GalleryRow[] {
  const rows: GalleryRow[] = [];
  images.forEach((image, index) => {
    if (image.layout === "half") {
      const last = rows[rows.length - 1];
      if (last && last.kind === "half" && last.items.length < 2) {
        last.items.push({ image, index });
        return;
      }
      rows.push({ kind: "half", items: [{ image, index }] });
      return;
    }
    rows.push({
      kind: image.layout === "offset" ? "offset" : "full",
      items: [{ image, index }],
    });
  });
  return rows;
}

const SIZES: Record<GalleryRow["kind"], string> = {
  full: "100vw",
  half: "(min-width: 768px) 50vw, 100vw",
  offset: "(min-width: 768px) 60vw, 100vw",
};

export default function CaseGallery({
  images,
  projectName,
}: {
  images: ProjectImage[];
  projectName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const rows = buildRows(images);
  let offsetCount = 0;

  return (
    <div className="space-y-6 md:space-y-12">
      {rows.map((row, rowIndex) => {
        if (row.kind === "offset") offsetCount += 1;
        const alignEnd = row.kind === "offset" && offsetCount % 2 === 0;
        return (
          <div
            key={`row-${rowIndex}`}
            className={cn(
              row.kind !== "full" && "container-site",
              row.kind === "half" && "grid gap-6 md:grid-cols-2 md:gap-12",
              row.kind === "offset" && "flex",
              alignEnd && "justify-end",
            )}
          >
            {row.items.map(({ image, index }, itemIndex) => (
              <figure
                key={index}
                className={cn(row.kind === "offset" && "w-full md:w-3/5")}
              >
                <Reveal
                  variant="clip"
                  delay={itemIndex * STAGGER.cards}
                  className={cn(
                    "overflow-hidden",
                    row.kind !== "full" && "rounded-card",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    aria-label={`View larger image: ${
                      image.alt || `${projectName} gallery image ${index + 1}`
                    }`}
                    data-cursor="view"
                    data-cursor-label="View"
                    className={cn(
                      "group relative block w-full",
                      row.kind === "full" ? "aspect-[21/9]" : "aspect-[4/3]",
                    )}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes={SIZES[row.kind]}
                      className="object-cover transition-transform [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                  </button>
                </Reveal>
                {image.caption ? (
                  <figcaption
                    className={cn(
                      "mt-3 text-sm text-stone",
                      row.kind === "full" && "container-site",
                    )}
                  >
                    {image.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        );
      })}
      <Lightbox
        images={images.map((image) => ({
          src: image.src,
          alt: image.alt,
          caption: image.caption,
        }))}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
      />
    </div>
  );
}
