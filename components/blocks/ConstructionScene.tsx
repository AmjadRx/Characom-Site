import type { BlockComponentProps } from "@/components/blocks/registry";
import SectionHeader from "@/components/ui/SectionHeader";
import TowerSceneClient, {
  type Reason,
} from "./client/scene/TowerSceneClient";
import MansionSceneClient from "./client/scene/MansionSceneClient";

/**
 * 3D construction timelapse scenes (owner directives 2026-07-12): isometric
 * CSS-3D builds scrubbed by scroll, sized to always fit the viewport.
 *  - "mansion": a residential villa rises: vehicles arrive, workers and
 *    scaffolding appear, volumes stack, the pool fills, trees grow, the crew
 *    leaves and the family arrives as the windows warm up.
 *  - "tower": a corporate tower rises floor by floor, and every floor
 *    reveals the next of the "12 reasons to choose Characom".
 * Pure CSS 3D + GSAP, no extra dependencies.
 */

type ConstructionSceneProps = {
  kicker: string;
  heading: string;
  text: string;
  floors: number;
  caption: string;
  variant: "tower" | "mansion";
  reasons: Reason[];
};

export default async function ConstructionScene({
  props,
}: BlockComponentProps) {
  const p = props as unknown as ConstructionSceneProps;
  const floors = Math.max(4, Math.min(20, Math.round(p.floors || 12)));
  const variant = p.variant === "mansion" ? "mansion" : "tower";
  const reasons = (p.reasons ?? []).filter((r) => r?.title);

  return (
    <section
      data-nav-theme="dark"
      className="section-dark on-dark overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--ink) 0%, #16102a 55%, #241536 100%)",
      }}
    >
      <div className="container-site pt-[var(--section-pad)]">
        <SectionHeader
          kicker={p.kicker}
          heading={p.heading}
          text={p.text}
          dark
          theme="gold"
        />
      </div>
      <div className="container-site">
        {variant === "mansion" ? (
          <MansionSceneClient caption={p.caption} />
        ) : (
          <TowerSceneClient
            floors={floors}
            caption={p.caption}
            reasons={reasons}
          />
        )}
      </div>
    </section>
  );
}
