import type { Metadata } from "next";
import PagesListScreen from "@/components/admin/builder/PagesListScreen";

export const metadata: Metadata = { title: "Pages · Characom Admin" };

export default function AdminPagesRoute() {
  return <PagesListScreen />;
}
