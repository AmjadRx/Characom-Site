import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return blockPageMetadata("certifications");
}

export default function CertificationsPage() {
  return <BlockPage slug="certifications" pathname="/certifications" />;
}
