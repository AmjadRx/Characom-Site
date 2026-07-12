import type { Metadata } from "next";
import CategoriesScreen from "@/components/admin/collections/CategoriesScreen";

export const metadata: Metadata = { title: "Categories · Characom Admin" };

export default function AdminCategoriesRoute() {
  return <CategoriesScreen />;
}
