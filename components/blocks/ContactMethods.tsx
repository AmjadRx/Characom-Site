import type { BlockComponentProps } from "@/components/blocks/registry";
import { getSettings } from "@/lib/content";
import { Reveal } from "@/components/motion";
import { STAGGER } from "@/lib/motion/constants";
import ContactMethodsCard, {
  type ContactMethodsCardProps,
} from "./client/ContactMethodsCard";

interface ContactMethodsBlockProps {
  showOffices?: boolean;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/**
 * §5.5 Contact method cards (dark) — Phone / Email / Fax / Address from
 * Site Settings. Each card: self-drawing SVG icon, value in display type,
 * copy-to-clipboard micro-interaction. Office list with hours below when
 * enabled.
 */
export default async function ContactMethods({ props }: BlockComponentProps) {
  const p = props as unknown as ContactMethodsBlockProps;
  const settings = await getSettings();
  const { phones, emails, fax, offices } = settings.contact;

  const cards: ContactMethodsCardProps[] = [];
  const phone = phones[0];
  if (phone) {
    cards.push({ kind: "phone", label: "Phone", value: phone, href: telHref(phone) });
  }
  const email = emails[0];
  if (email) {
    cards.push({ kind: "email", label: "Email", value: email, href: `mailto:${email}` });
  }
  if (fax) {
    cards.push({ kind: "fax", label: "Fax", value: fax });
  }
  const headOffice = offices[0];
  if (headOffice?.address) {
    cards.push({
      kind: "address",
      label: headOffice.name || "Head office",
      value: headOffice.address,
    });
  }

  const showOffices = p.showOffices !== false && offices.length > 0;
  if (cards.length === 0 && !showOffices) return null;

  return (
    <section className="section-dark on-dark section-pad" data-nav-theme="dark">
      <div className="container-site">
        {cards.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {cards.map((card, i) => (
              <Reveal
                key={card.kind}
                delay={(i % 2) * STAGGER.cards}
                className="h-full"
              >
                <ContactMethodsCard {...card} />
              </Reveal>
            ))}
          </div>
        )}

        {showOffices && (
          <div className={cards.length > 0 ? "mt-16" : undefined}>
            <p className="kicker kicker--accent">Our offices</p>
            <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {offices.map((office, i) => (
                <Reveal
                  as="li"
                  key={`${office.name}-${i}`}
                  delay={(i % 3) * STAGGER.cards}
                >
                  <div className="h-full border-t border-white/10 pt-5">
                    <h3 className="font-display text-lg font-semibold text-plaster">
                      {office.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-plaster/70">
                      {office.address}
                    </p>
                    {office.phone ? (
                      <p className="mt-3 text-sm">
                        <a
                          href={telHref(office.phone)}
                          className="link-underline text-plaster/80"
                        >
                          {office.phone}
                        </a>
                      </p>
                    ) : null}
                    {office.hours ? (
                      <p className="mt-1.5 text-sm text-stone">{office.hours}</p>
                    ) : null}
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
