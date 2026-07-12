import type { BlockComponentProps } from "@/components/blocks/registry";

/**
 * Raw HTML embed — owner-role gated in the admin (BLOCK_DEFS.rawEmbed
 * ownerOnly). Rendered as-is inside a clearly-bounded container; the trust
 * boundary is the owner role, not sanitization.
 */

type RawEmbedProps = {
  html: string;
};

export default async function RawEmbed({ props }: BlockComponentProps) {
  const p = props as unknown as RawEmbedProps;
  const html = (p.html ?? "").trim();
  if (!html) return null;

  return (
    <section data-block="raw-embed" className="section-pad">
      <div className="container-site">
        <div
          className="overflow-x-auto"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
