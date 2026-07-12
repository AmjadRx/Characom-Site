"use client";

/**
 * Client-side image downscaling before upload (ARCHITECTURE §7.3):
 * jpeg/png/webp larger than 2560px on their longest edge are resized on a
 * canvas. Anything else — or any failure — falls back to the original file.
 */

export const MAX_UPLOAD_DIMENSION = 2560;

const DOWNSCALE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface Drawable {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function loadDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image decode failed"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Returns a resized File when the image exceeds MAX_UPLOAD_DIMENSION,
 * otherwise the original file. Never throws.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!DOWNSCALE_TYPES.has(file.type)) return file;

  let drawable: Drawable | null = null;
  try {
    drawable = await loadDrawable(file);
    const { width, height } = drawable;
    const longest = Math.max(width, height);
    if (!width || !height || longest <= MAX_UPLOAD_DIMENSION) return file;

    const scale = MAX_UPLOAD_DIMENSION / longest;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(drawable.source, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        resolve,
        file.type,
        file.type === "image/png" ? undefined : 0.9,
      ),
    );
    if (!blob || blob.size === 0 || blob.size >= file.size) return file;

    return new File([blob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    drawable?.cleanup();
  }
}
