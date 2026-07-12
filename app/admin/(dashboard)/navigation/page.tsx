import type { Metadata } from "next";
import NavigationScreen from "@/components/admin/collections/NavigationScreen";

export const metadata: Metadata = { title: "Navigation · Characom Admin" };

export default function AdminNavigationRoute() {
  return <NavigationScreen />;
}
