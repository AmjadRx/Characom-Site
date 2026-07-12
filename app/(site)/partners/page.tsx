import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return blockPageMetadata("partners");
}

export default function PartnersPage() {
  return <BlockPage slug="partners" pathname="/partners" />;
}
