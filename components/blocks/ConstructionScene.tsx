import type { BlockComponentProps } from "@/components/blocks/registry";
import TowerSceneClient, {
  type Reason,
} from "./client/scene/TowerSceneClient";
import MansionSceneClient from "./client/scene/MansionSceneClient";

/**
 * 3D construction timelapse scenes (owner directives 2026-07-12): isometric
 * CSS-3D builds scrubbed by scroll. The whole composition, title block
 * included, lives inside one pinned viewport frame and the section consumes
 * an exact whole number of screens of scroll.
 *  - "mansion": a villa rises with crew, vehicles and trees; four reasons
 *    tied to the company's roots reveal with the build phases.
 *  - "tower": a corporate tower rises floor by floor; each floor reveals
 *    the next of the twelve reasons to choose Characom.
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
  const header = { kicker: p.kicker, heading: p.heading, text: p.text };

  return (
    <section
      data-nav-theme="dark"
      className="section-dark on-dark overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--ink) 0%, #16102a 55%, #241536 100%)",
      }}
    >
      {variant === "mansion" ? (
        <MansionSceneClient
          caption={p.caption}
          reasons={reasons}
          header={header}
        />
      ) : (
        <TowerSceneClient
          floors={floors}
          caption={p.caption}
          reasons={reasons}
          header={header}
        />
      )}
    </section>
  );
}
