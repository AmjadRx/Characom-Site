import type { BlockComponentProps } from "@/components/blocks/registry";
import SectionHeader from "@/components/ui/SectionHeader";
import ConstructionSceneClient from "./client/ConstructionSceneClient";

/**
 * 3D construction timelapse (owner directive 2026-07-12): an isometric
 * CSS-3D corporate tower rises floor by floor as the visitor scrolls, with
 * a slowly slewing crane — a living construction site on the homepage.
 * Pure CSS 3D transforms + GSAP scrub; zero extra dependencies.
 */

type ConstructionSceneProps = {
  kicker: string;
  heading: string;
  text: string;
  floors: number;
  caption: string;
};

export default async function ConstructionScene({
  props,
}: BlockComponentProps) {
  const p = props as unknown as ConstructionSceneProps;
  const floors = Math.max(4, Math.min(20, Math.round(p.floors || 12)));

  return (
    <section
      data-nav-theme="dark"
      className="section-dark on-dark overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--ink) 0%, #16102a 55%, #241536 100%)",
      }}
    >
      <div className="container-site section-pad relative">
        <SectionHeader
          kicker={p.kicker}
          heading={p.heading}
          text={p.text}
          dark
          theme="gold"
        />
        <ConstructionSceneClient floors={floors} caption={p.caption} />
      </div>
    </section>
  );
}
