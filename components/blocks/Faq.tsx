import type { BlockComponentProps } from "@/components/blocks/registry";
import SectionHeader from "@/components/ui/SectionHeader";
import FaqAccordionClient, {
  type FaqItem,
} from "./client/FaqAccordionClient";

/**
 * FAQ accordion block — accessible expand/collapse Q&A list.
 */

type FaqProps = {
  kicker: string;
  heading: string;
  items: FaqItem[];
};

export default async function Faq({ props }: BlockComponentProps) {
  const p = props as unknown as FaqProps;
  const items = (p.items ?? []).filter((item) => item && item.question);
  if (items.length === 0 && !p.heading && !p.kicker) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />
        {items.length > 0 ? (
          <FaqAccordionClient items={items} className="max-w-3xl" />
        ) : null}
      </div>
    </section>
  );
}
