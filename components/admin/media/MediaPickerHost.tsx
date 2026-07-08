"use client";

/**
 * Global media picker host.
 *
 * Registers `window.__characomMediaPicker` (contract: ImageField's "Browse…"
 * button calls it) and opens the media library in select mode. Render this
 * once on every admin screen that shows image fields — the builder, projects,
 * categories, news editors and the media page itself.
 */

import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/admin/collections/kit";
import MediaLibrary, { type MediaSelection } from "./MediaLibrary";

export type MediaPickerCallback = (image: MediaSelection) => void;

declare global {
  interface Window {
    __characomMediaPicker?: (cb: MediaPickerCallback) => void;
  }
}

export default function MediaPickerHost() {
  const [open, setOpen] = useState(false);
  const callbackRef = useRef<MediaPickerCallback | null>(null);

  useEffect(() => {
    const openPicker = (cb: MediaPickerCallback) => {
      callbackRef.current = cb;
      setOpen(true);
    };
    window.__characomMediaPicker = openPicker;
    return () => {
      if (window.__characomMediaPicker === openPicker) {
        window.__characomMediaPicker = undefined;
      }
    };
  }, []);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Choose media"
      width="xl"
      layer="top"
    >
      {open ? (
        <MediaLibrary
          mode="select"
          onSelect={(image) => {
            callbackRef.current?.(image);
            callbackRef.current = null;
            setOpen(false);
          }}
        />
      ) : null}
    </Drawer>
  );
}
