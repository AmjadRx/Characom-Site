import type { BlockComponentProps } from "@/components/blocks/registry";
import SectionHeader from "@/components/ui/SectionHeader";
import TestimonialsSlider, {
  type TestimonialItem,
} from "./client/TestimonialsSlider";

interface TestimonialsProps {
  kicker?: string;
  heading?: string;
  items?: TestimonialItem[];
}

/**
 * Client-quote slider: Framer drag + AnimatePresence with 7s auto-advance
 * (pauses on hover/focus), dot + arrow controls, carousel aria semantics.
 */
export default async function Testimonials({ props }: BlockComponentProps) {
  const p = props as unknown as TestimonialsProps;
  const items = (Array.isArray(p.items) ? p.items : []).filter((item) =>
    item?.quote?.trim(),
  );
  if (items.length === 0) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />
        <div className="max-w-4xl">
          <TestimonialsSlider items={items} />
        </div>
      </div>
    </section>
  );
}
