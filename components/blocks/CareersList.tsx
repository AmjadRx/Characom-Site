import type { BlockComponentProps } from "@/components/blocks/registry";
import { getOpenPositions } from "@/lib/content";
import SectionHeader from "@/components/ui/SectionHeader";
import RichText from "@/components/ui/RichText";
import CareersListAccordion, {
  type CareersListItem,
} from "./client/CareersListAccordion";

interface CareersListProps {
  kicker?: string;
  heading?: string;
  emptyText?: string;
}

/**
 * Open positions accordion — rows (title · department · location · type)
 * expand to the rich-text description with an "Apply" morph button linking
 * to /contact?subject=careers. Descriptions are rendered server-side and
 * passed into the client accordion as ReactNodes.
 */
export default async function CareersList({ props }: BlockComponentProps) {
  const p = props as unknown as CareersListProps;
  const positions = await getOpenPositions();

  const items: CareersListItem[] = positions.map((position) => ({
    id: position.id,
    title: position.title,
    department: position.department,
    location: position.location,
    type: position.type,
    content: <RichText doc={position.description} />,
  }));

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />

        {items.length === 0 ? (
          <p className="max-w-xl text-stone">
            {p.emptyText || "No open positions right now — check back soon."}
          </p>
        ) : (
          <CareersListAccordion items={items} />
        )}
      </div>
    </section>
  );
}
