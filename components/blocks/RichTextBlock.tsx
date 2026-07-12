import type { BlockComponentProps } from "@/components/blocks/registry";
import type { RichDoc } from "@/lib/content/types";
import { isEmptyRichDoc } from "@/lib/content/rich-text";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion";
import RichText from "@/components/ui/RichText";

/**
 * Editorial rich-text column: ui/RichText inside a narrow (~65ch) or wide
 * measure, revealed on scroll.
 */

type RichTextBlockProps = {
  kicker: string;
  body: RichDoc;
  maxWidth: "narrow" | "wide";
  dark: boolean;
};

export default async function RichTextBlock({ props }: BlockComponentProps) {
  const p = props as unknown as RichTextBlockProps;
  const empty = isEmptyRichDoc(p.body);
  if (empty && !p.kicker) return null;

  return (
    <section
      data-nav-theme={p.dark ? "dark" : undefined}
      className={cn("section-pad", p.dark && "section-dark on-dark")}
    >
      <div className="container-site">
        <div className={p.maxWidth === "wide" ? "max-w-[92ch]" : "max-w-[68ch]"}>
          {p.kicker ? (
            <Reveal variant="fade" as="p" className="mb-6">
              <span className="kicker">{p.kicker}</span>
            </Reveal>
          ) : null}
          {!empty ? (
            <Reveal variant="fade" delay={p.kicker ? 0.1 : 0}>
              <RichText doc={p.body} dark={p.dark} />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
