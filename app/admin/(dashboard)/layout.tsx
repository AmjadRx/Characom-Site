import AdminShell from "@/components/admin/AdminShell";

/** Every admin screen except /admin/login renders inside the shell. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
