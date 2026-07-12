import type { Metadata } from "next";
import NewsScreen from "@/components/admin/collections/NewsScreen";

export const metadata: Metadata = { title: "News · Characom Admin" };

export default function AdminNewsRoute() {
  return <NewsScreen />;
}
