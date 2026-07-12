import type { Metadata } from "next";
import ProjectsScreen from "@/components/admin/collections/ProjectsScreen";

export const metadata: Metadata = { title: "Projects · Characom Admin" };

export default function AdminProjectsRoute() {
  return <ProjectsScreen />;
}
