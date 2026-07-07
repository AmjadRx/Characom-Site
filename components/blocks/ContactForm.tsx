import type { BlockComponentProps } from "@/components/blocks/registry";
import SectionHeader from "@/components/ui/SectionHeader";
import ContactFormClient from "./client/ContactFormClient";

interface ContactFormProps {
  heading?: string;
  text?: string;
}

/**
 * §5.5 Contact form — validated inquiry form posting to /api/inquiries
 * with honeypot + time-trap anti-spam and a morphing submit button.
 */
export default async function ContactForm({ props }: BlockComponentProps) {
  const p = props as unknown as ContactFormProps;

  return (
    <section className="section-pad">
      <div className="container-site">
        <div className="mx-auto max-w-3xl">
          <SectionHeader heading={p.heading} text={p.text} />
          <ContactFormClient />
        </div>
      </div>
    </section>
  );
}
