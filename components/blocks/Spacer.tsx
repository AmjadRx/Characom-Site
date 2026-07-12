import type { BlockComponentProps } from "@/components/blocks/registry";
import { cn } from "@/lib/utils";

/**
 * Vertical breathing room between blocks, optionally with a hairline divider.
 */

type SpacerProps = {
  size: "sm" | "md" | "lg";
  showDivider: boolean;
};

const HEIGHTS: Record<SpacerProps["size"], string> = {
  sm: "h-10 md:h-16",
  md: "h-16 md:h-28",
  lg: "h-28 md:h-44",
};

export default async function Spacer({ props }: BlockComponentProps) {
  const p = props as unknown as SpacerProps;
  const size: SpacerProps["size"] = p.size ?? "md";

  return (
    <div aria-hidden="true" className={cn("flex items-center", HEIGHTS[size])}>
      {p.showDivider ? (
        <div className="container-site">
          <div className="h-px w-full bg-ink/10" />
        </div>
      ) : null}
    </div>
  );
}
