import type { Metadata } from "next";
import { ReducedMotionProvider } from "@/components/providers/ReducedMotionProvider";
import QueryProvider from "@/components/admin/QueryProvider";
import { ToastProvider } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: {
    default: "Characom Admin",
    template: "%s · Characom Admin",
  },
  robots: { index: false, follow: false },
};

/**
 * Admin root layout — data + toast providers only. No site providers
 * (Lenis/cursor/preloader): the admin uses plain scrolling. The console
 * chrome (AdminShell) lives in the (dashboard) route-group layout so the
 * login screen renders without it.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionProvider>
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </ReducedMotionProvider>
  );
}
