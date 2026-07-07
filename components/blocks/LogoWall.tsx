import Image from "next/image";
import type { BlockComponentProps } from "@/components/blocks/registry";
import { Reveal } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import { STAGGER } from "@/lib/motion/constants";

interface LogoItem {
  name: string;
  image: { src: string; alt: string };
  href?: string;
}

interface LogoWallProps {
  kicker?: string;
  heading?: string;
  logos?: LogoItem[];
}

/**
 * Partner/client logo wall — logos sit grayscale at reduced opacity and
 * come to full color on hover/focus (pure CSS). When a logo image is
 * missing, the partner name renders as a display-type placeholder chip.
 */
export default async function LogoWall({ props }: BlockComponentProps) {
  const p = props as LogoWallProps;
  const logos = (Array.isArray(p.logos) ? p.logos : []).filter(
    (l) => l && (l.name || l.image?.src),
  );
  if (logos.length === 0) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />

        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {logos.map((logo, i) => {
            const external = Boolean(logo.href?.startsWith("http"));
            const inner = logo.image?.src ? (
              <span className="relative block h-16 w-full opacity-60 grayscale transition-[opacity,filter] duration-500 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0">
                <Image
                  src={logo.image.src}
                  alt={logo.image.alt || logo.name}
                  fill
                  sizes="(min-width: 1024px) 15vw, 40vw"
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="flex h-16 items-center justify-center rounded-card border border-ink/15 px-4 text-center font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors duration-500 group-hover:border-ink/40 group-hover:text-ink group-focus-visible:border-ink/40 group-focus-visible:text-ink">
                {logo.name}
              </span>
            );

            return (
              <Reveal
                as="li"
                key={`${logo.name}-${i}`}
                variant="fade"
                delay={(i % 6) * STAGGER.listRows}
              >
                {logo.href ? (
                  <a
                    href={logo.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer noopener" : undefined}
                    aria-label={logo.name || undefined}
                    className="group block rounded-card p-2"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="group p-2">{inner}</div>
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
