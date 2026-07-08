import type { Metadata } from "next";
import CareersScreen from "@/components/admin/collections/CareersScreen";

export const metadata: Metadata = { title: "Careers · Characom Admin" };

export default function AdminCareersRoute() {
  return <CareersScreen />;
}
