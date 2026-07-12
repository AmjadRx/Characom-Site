import type { Metadata } from "next";
import { BlockPage, blockPageMetadata } from "../_shared/block-page";

/**
 * Catch-all renderer for admin-created pages (e.g. /legal/privacy).
 * Structured routes (portfolio, news, contact, …) are more specific and win
 * by router precedence; anything else resolves against the pages collection
 * and 404s when missing or unpublished (draft-mode excepted).
 */

export const revalidate = 300;

interface CatchAllProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: CatchAllProps): Promise<Metadata> {
  const { slug } = await params;
  return blockPageMetadata(slug.join("/"));
}

export default async function CatchAllPage({ params }: CatchAllProps) {
  const { slug } = await params;
  const joined = slug.join("/");
  return <BlockPage slug={joined} pathname={`/${joined}`} />;
}
