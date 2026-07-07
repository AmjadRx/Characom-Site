import Image from "next/image";
import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { LinkProps } from "@/lib/blocks/defs";
import { cn } from "@/lib/utils";
import { Parallax, Reveal, SplitTextReveal } from "@/components/motion";
import ImageWithTextBodyClient from "./client/ImageWithTextBodyClient";

/**
 * Editorial paragraph with the "reading light" line reveal beside a
 * portrait-ratio parallax image (ARCHITECTURE.md §5.1.3). The image moves
 * slower than its overflow-hidden frame; optional animated-underline link.
 */

type ImageWithTextProps = {
  kicker: string;
  heading: string;
  body: string;
  image: { src: string; alt: string };
  imageSide: "left" | "right";
  link?: LinkProps;
  dark: boolean;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default async function ImageWithText({ props }: BlockComponentProps) {
  const p = props as unknown as ImageWithTextProps;
  const hasImage = Boolean(p.image?.src);
  const hasBody = Boolean((p.body ?? "").trim());
  if (!hasBody && !p.heading && !p.kicker && !hasImage) return null;

  const imageLeft = p.imageSide === "left";
  const link = p.link;

  return (
    <section
      data-nav-theme={p.dark ? "dark" : undefined}
      className={cn("section-pad", p.dark && "section-dark on-dark")}
    >
      <div className="container-site">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Text column */}
          <div
            className={cn(
              "lg:row-start-1",
              imageLeft
                ? "lg:col-span-6 lg:col-start-7"
                : "lg:col-span-6 lg:col-start-1",
              !hasImage && "lg:col-span-8",
            )}
          >
            {p.kicker ? (
              <Reveal variant="fade" as="p" className="mb-5">
                <span className="kicker">{p.kicker}</span>
              </Reveal>
            ) : null}
            {p.heading ? (
              <SplitTextReveal
                text={p.heading}
                as="h2"
                className="text-display-2 mb-8"
              />
            ) : null}
            {hasBody ? (
              <ImageWithTextBodyClient
                text={p.body}
                className={cn(
                  "space-y-6 text-lg leading-[1.75] md:text-xl",
                  p.dark ? "text-plaster" : "text-ink",
                )}
              />
            ) : null}
            {link?.label && link?.href ? (
              <Reveal variant="fade" delay={0.1} className="mt-8">
                <Link
                  href={link.href}
                  className={cn(
                    "link-underline inline-flex items-center gap-2 font-medium",
                    p.dark ? "text-gold-bright" : "text-gold-deep",
                  )}
                >
                  {link.label}
                  <ArrowIcon className="size-4 shrink-0" />
                </Link>
              </Reveal>
            ) : null}
          </div>

          {/* Portrait image with parallax inside an overflow-hidden frame */}
          {hasImage ? (
            <div
              className={cn(
                "lg:row-start-1",
                imageLeft
                  ? "lg:col-span-5 lg:col-start-1"
                  : "lg:col-span-5 lg:col-start-8",
              )}
            >
              <Reveal variant="clip">
                <div className="rounded-card relative aspect-3/4 overflow-hidden">
                  <Parallax
                    speed={0.88}
                    className="absolute inset-x-0 -top-[8%] -bottom-[8%]"
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={p.image.src}
                        alt={p.image.alt}
                        fill
                        sizes="(min-width: 1024px) 42vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </Parallax>
                </div>
              </Reveal>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
