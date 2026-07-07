import type { BlockComponentProps } from "@/components/blocks/registry";
import { getSettings } from "@/lib/content";
import MapEmbedFrame from "./client/MapEmbedFrame";

interface MapEmbedProps {
  embedUrl?: string;
}

/**
 * §5.5 dark-styled map — lazy iframe (IntersectionObserver mount) wrapped
 * in a grayscale/invert filter for the ink look. Uses the block's URL or
 * falls back to Site Settings; renders nothing when neither is set.
 */
export default async function MapEmbed({ props }: BlockComponentProps) {
  const p = props as MapEmbedProps;
  const settings = await getSettings();
  const src = p.embedUrl || settings.integrations.mapEmbedUrl || "";
  if (!src) return null;

  return (
    <section className="section-dark on-dark" data-nav-theme="dark">
      <MapEmbedFrame
        src={src}
        title={`Map — ${settings.siteName} offices`}
      />
    </section>
  );
}
