import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return blockPageMetadata("careers");
}

export default function CareersPage() {
  return <BlockPage slug="careers" pathname="/careers" />;
}
