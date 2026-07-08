import type { MediaItem } from "@/lib/content/types";

/**
 * Typed fetch helpers for the admin console (CONTRACTS.md §Admin).
 * Used by every admin screen — all requests carry the session cookie, all
 * non-2xx JSON errors become thrown `Error(message)`, and a 401 redirects
 * to the login screen (session expired).
 *
 * `path` may be either relative to the admin API ("settings",
 * "pages/detail?slug=home") or an absolute path ("/api/admin/settings").
 */

function resolvePath(path: string): string {
  return path.startsWith("/") ? path : `/api/admin/${path}`;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin/login")) return;
  const next = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  window.location.assign(`/admin/login?next=${next}`);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Your session has expired — please sign in again.");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Some endpoints (or proxies) may return an empty body.
  }
  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

/** GET an admin API resource. */
export async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(resolvePath(path), {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return handleResponse<T>(res);
}

/** Send a JSON body (PUT/POST/PATCH/DELETE) to an admin API resource. */
export async function adminSend<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(resolvePath(path), {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return handleResponse<T>(res);
}

/** Upload a media binary (multipart) → returns the created MediaItem. */
export async function uploadMedia(file: File, alt: string): Promise<MediaItem> {
  const form = new FormData();
  form.append("file", file);
  form.append("alt", alt);
  const res = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  return handleResponse<MediaItem>(res);
}
