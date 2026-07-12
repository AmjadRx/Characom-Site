/**
 * Fallback imagery for the load screens (Preloader + route transitions):
 * large construction/architecture photography shown behind the counting
 * percentage. Overridable in Admin → Settings (settings.loaderImages) —
 * these free Unsplash placeholders apply until the owner uploads real
 * site photography.
 */
export const DEFAULT_LOADER_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1444723121867-7a241cacace9?q=80&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=2400&auto=format&fit=crop",
];

/** Deterministic pick — same result on server and client for a given path. */
export function pickLoaderImage(images: string[], seed: string): string {
  const list = images.length > 0 ? images : DEFAULT_LOADER_IMAGES;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return list[Math.abs(hash) % list.length];
}

/**
 * Serve loader photos through Next's image optimizer (same-origin, AVIF/WebP,
 * server-side fetch of the remote original) instead of hotlinking the raw
 * URL from the browser. w=1920 is a default deviceSize.
 */
export function loaderImageSrc(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;
}
