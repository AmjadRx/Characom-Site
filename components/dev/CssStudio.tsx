"use client";

import { useEffect } from "react";

/**
 * CSS Studio (cssstudio.ai) — development-only visual CSS editing.
 * Loaded via dynamic import inside a dead-code-eliminated branch so it is
 * NEVER shipped to production users.
 */
export default function CssStudio() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("cssstudio")
        .then(({ startStudio }) => startStudio())
        .catch((err) => console.warn("[cssstudio] failed to start:", err));
    }
  }, []);

  return null;
}
