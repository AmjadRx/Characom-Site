import Image from "next/image";
import type { BlockComponentProps } from "@/components/blocks/registry";
import { Reveal } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import { STAGGER } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";

interface TeamMember {
  name: string;
  role: string;
  photo: { src: string; alt: string };
  bio: string;
}

interface TeamGridProps {
  kicker?: string;
  heading?: string;
  members?: TeamMember[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Leadership grid — hovering (or keyboard-focusing) a card desaturates the
 * portrait and rises a bio overlay. Pure CSS interaction; cards stagger in
 * with Reveal. Cards with a bio are focusable so keyboard users get the
 * same disclosure via :focus-within.
 */
export default async function TeamGrid({ props }: BlockComponentProps) {
  const p = props as TeamGridProps;
  const members = (Array.isArray(p.members) ? p.members : []).filter(
    (m) => m && m.name,
  );
  if (members.length === 0) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />

        <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member, i) => {
            const hasBio = Boolean(member.bio?.trim());
            return (
              <Reveal
                as="li"
                key={`${member.name}-${i}`}
                delay={(i % 4) * STAGGER.cards}
              >
                <article
                  tabIndex={hasBio ? 0 : undefined}
                  className="group relative h-full"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-ink-soft">
                    {member.photo?.src ? (
                      <Image
                        src={member.photo.src}
                        alt={member.photo.alt || member.name}
                        fill
                        sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 92vw"
                        className={cn(
                          "object-cover transition-[transform,filter] duration-700",
                          hasBio &&
                            "group-hover:scale-[1.04] group-hover:grayscale group-focus-within:scale-[1.04] group-focus-within:grayscale",
                        )}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 grid place-items-center font-display text-5xl font-semibold text-plaster/25"
                      >
                        {initials(member.name)}
                      </span>
                    )}

                    {hasBio && (
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/90 via-ink/45 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
                        <p className="translate-y-4 p-6 text-sm leading-relaxed text-plaster/90 transition-transform duration-500 group-hover:translate-y-0 group-focus-within:translate-y-0">
                          {member.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <h3 className="font-display text-lg font-semibold leading-tight">
                      {member.name}
                    </h3>
                    {member.role ? (
                      <p className="mt-1 text-sm text-stone">{member.role}</p>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
