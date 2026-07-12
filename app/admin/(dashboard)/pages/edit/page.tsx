import { Suspense } from "react";
import type { Metadata } from "next";
import PageBuilder from "@/components/admin/builder/PageBuilder";

export const metadata: Metadata = { title: "Page builder · Characom Admin" };

/**
 * /admin/pages/edit?slug=<slug> — the block builder.
 * PageBuilder reads ?slug= via useSearchParams, so it must render inside
 * a Suspense boundary (Next 15 requirement for CSR bailout).
 */
export default function AdminPageBuilderRoute() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-stone" role="status">
          Loading builder…
        </p>
      }
    >
      <PageBuilder />
    </Suspense>
  );
}
