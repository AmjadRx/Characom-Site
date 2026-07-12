import type { RichDoc, RichNode } from "./types";

/** Build a Tiptap doc from plain paragraphs — used by seeds and fallbacks. */
export function paragraphsToRichDoc(paragraphs: string[]): RichDoc {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

export function richDocToPlainText(doc: RichDoc | undefined | null): string {
  if (!doc?.content) return "";
  const walk = (nodes: RichNode[]): string =>
    nodes
      .map((n) => (n.text ?? "") + (n.content ? walk(n.content) : ""))
      .join(" ");
  return walk(doc.content).replace(/\s+/g, " ").trim();
}

export function isEmptyRichDoc(doc: RichDoc | undefined | null): boolean {
  return richDocToPlainText(doc).length === 0;
}
