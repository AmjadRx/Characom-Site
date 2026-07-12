import type { Metadata } from "next";
import { MediaLibrary, MediaPickerHost } from "@/components/admin/media";

export const metadata: Metadata = { title: "Media · Characom Admin" };

export default function AdminMediaRoute() {
  return (
    <>
      <MediaLibrary mode="manage" />
      <MediaPickerHost />
    </>
  );
}
