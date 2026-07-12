import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return blockPageMetadata("about");
}

export default function AboutPage() {
  return <BlockPage slug="about" pathname="/about" />;
}
