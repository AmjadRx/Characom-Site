import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return blockPageMetadata("contact");
}

export default function ContactPage() {
  return <BlockPage slug="contact" pathname="/contact" />;
}
