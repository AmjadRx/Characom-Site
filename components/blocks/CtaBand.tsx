import type { BlockComponentProps } from "@/components/blocks/registry";
import type { LinkProps } from "@/lib/blocks/defs";
import { MorphButton } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import CtaBandClient from "./client/CtaBandClient";

/**
 * CTA band (ARCHITECTURE.md §5.1.8): ink background with a radial gold mesh,
 * display-2 split-text heading and a morphing CTA button. The whole band
 * scales 0.96 → 1 and fades in on enter (GSAP, once).
 */

type CtaBandProps = {
  kicker: string;
  heading: string;
  text: string;
  button: LinkProps;
  image?: { src: string; alt: string };
};

export default async function CtaBand({ props }: BlockComponentProps) {
  const p = props as unknown as CtaBandProps;
  const button = p.button;
  if (!p.heading && !p.text && !button?.label) return null;
  const hasImage = Boolean(p.image?.src);

  return (
    <section data-nav-theme="dark" className="on-dark">
      <CtaBandClient className="section-dark gold-mesh section-pad relative overflow-hidden">
        {hasImage ? (
          <div aria-hidden="true" className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image!.src}
              alt=""
              className="h-full w-full object-cover opacity-25"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgb(10 10 13 / 0.9), rgb(10 10 13 / 0.6))",
              }}
            />
          </div>
        ) : null}
        <div className="container-site relative flex flex-col items-center text-center">
          <SectionHeader
            kicker={p.kicker}
            heading={p.heading}
            text={p.text}
            dark
            align="center"
            theme="gold"
          />
          {button?.label && button?.href ? (
            <MorphButton
              label={button.label}
              href={button.href}
              variant={button.variant === "ghost" ? "ghost" : "gold"}
              dark
            />
          ) : null}
        </div>
      </CtaBandClient>
    </section>
  );
}
