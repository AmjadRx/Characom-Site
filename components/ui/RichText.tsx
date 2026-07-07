import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { RichDoc, RichNode } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * Server-safe renderer for Tiptap JSON documents (CONTRACTS.md — ui/RichText).
 * Supported nodes: paragraph, heading 2–4, bulletList, orderedList, listItem,
 * blockquote, image, horizontalRule, hardBreak, text. Marks: bold, italic,
 * link. Never uses dangerouslySetInnerHTML — the document is walked as data.
 * Unknown node types degrade gracefully (children rendered, node skipped).
 */

export interface RichTextProps {
  doc: RichDoc;
  className?: string;
  dark?: boolean;
}

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : fallback;
}

function renderTextNode(node: RichNode, dark: boolean): ReactNode {
  let rendered: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        rendered = <strong className="font-semibold">{rendered}</strong>;
        break;
      case "italic":
        rendered = <em>{rendered}</em>;
        break;
      case "link": {
        const href = str(mark.attrs?.href);
        if (!href) break;
        const linkClass = cn(
          "underline decoration-1 underline-offset-4 transition-colors duration-300",
          dark
            ? "text-gold-bright hover:text-gold"
            : "text-gold-deep hover:text-gold",
        );
        rendered = isInternalHref(href) ? (
          <Link href={href} className={linkClass}>
            {rendered}
          </Link>
        ) : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {rendered}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return rendered;
}

function renderNodes(nodes: RichNode[] | undefined, dark: boolean): ReactNode {
  return (nodes ?? []).map((node, i) => (
    <Fragment key={i}>{renderNode(node, dark)}</Fragment>
  ));
}

function renderNode(node: RichNode, dark: boolean): ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p className="mt-5 first:mt-0">{renderNodes(node.content, dark)}</p>;

    case "heading": {
      const rawLevel = node.attrs?.level;
      const level =
        typeof rawLevel === "number" ? Math.min(4, Math.max(2, rawLevel)) : 2;
      const children = renderNodes(node.content, dark);
      const color = dark ? "text-plaster" : "text-ink";
      if (level === 2) {
        return (
          <h2
            className={cn(
              "mt-12 text-2xl leading-tight first:mt-0 md:text-3xl",
              color,
            )}
          >
            {children}
          </h2>
        );
      }
      if (level === 3) {
        return (
          <h3
            className={cn(
              "mt-10 text-xl leading-snug first:mt-0 md:text-2xl",
              color,
            )}
          >
            {children}
          </h3>
        );
      }
      return (
        <h4 className={cn("mt-8 text-lg leading-snug first:mt-0", color)}>
          {children}
        </h4>
      );
    }

    case "bulletList":
      return (
        <ul
          className={cn(
            "mt-5 list-disc space-y-2 pl-5",
            dark ? "marker:text-gold-bright" : "marker:text-gold-deep",
          )}
        >
          {renderNodes(node.content, dark)}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          className={cn(
            "mt-5 list-decimal space-y-2 pl-5",
            dark ? "marker:text-gold-bright" : "marker:text-gold-deep",
          )}
        >
          {renderNodes(node.content, dark)}
        </ol>
      );

    case "listItem":
      return <li className="pl-1">{renderNodes(node.content, dark)}</li>;

    case "blockquote":
      return (
        <blockquote
          className={cn(
            "mt-8 border-l-2 pl-6 text-lg leading-relaxed md:text-xl",
            dark
              ? "border-gold-bright text-plaster/90"
              : "border-gold text-ink/85",
          )}
        >
          {renderNodes(node.content, dark)}
        </blockquote>
      );

    case "image": {
      const src = str(node.attrs?.src);
      if (!src) return null;
      const alt = str(node.attrs?.alt);
      const caption = str(node.attrs?.title);
      return (
        <figure className="mt-10">
          <Image
            src={src}
            alt={alt}
            width={num(node.attrs?.width, 1600)}
            height={num(node.attrs?.height, 1000)}
            sizes="(min-width: 768px) 680px, 100vw"
            className="h-auto w-full rounded-card"
          />
          {caption ? (
            <figcaption
              className={cn(
                "mt-3 text-sm",
                dark ? "text-plaster/60" : "text-stone",
              )}
            >
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "horizontalRule":
      return (
        <hr
          className={cn(
            "mt-12 border-t",
            dark ? "border-white/15" : "border-ink/10",
          )}
        />
      );

    case "hardBreak":
      return <br />;

    case "text":
      return renderTextNode(node, dark);

    default:
      // Unknown node — render its children so no content is lost.
      return node.content ? renderNodes(node.content, dark) : null;
  }
}

export function RichText({ doc, className, dark = false }: RichTextProps) {
  const nodes = doc?.content ?? [];
  if (nodes.length === 0) return null;
  return (
    <div
      className={cn(
        "text-base leading-[1.7] text-pretty md:text-lg",
        dark ? "text-plaster/85" : "text-ink/80",
        className,
      )}
    >
      {renderNodes(nodes, dark)}
    </div>
  );
}

export default RichText;
