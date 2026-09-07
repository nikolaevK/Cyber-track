import { useSyncExternalStore } from "react";
import type { LogoAsset } from "./spot-context";

const noop = () => () => {};
/** True only after hydration, so canvas-generated wordmarks never end up in server HTML. */
export const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

export const MAX_LOGO_BYTES = 1_500_000;
const MAX_EDGE = 1400;

/** Reads an image file, downsizes large ones, and returns a data URL with its natural size. */
export async function loadLogoFile(file: File): Promise<LogoAsset> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("Use a PNG, JPEG or WebP.");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That image could not be read."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const keepAlpha = file.type !== "image/jpeg";
    let src = canvas.toDataURL(keepAlpha ? "image/png" : "image/jpeg", 0.9);
    if (src.length > MAX_LOGO_BYTES && keepAlpha) src = canvas.toDataURL("image/webp", 0.9);
    if (src.length > MAX_LOGO_BYTES) throw new Error("Logo is too large. Keep it under about 1 MB.");
    return { src, w, h, kind: "image" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Renders a wordmark to a transparent PNG so it goes through the same overlay path as an uploaded logo. */
export function textLogo(text: string, color: string): LogoAsset | null {
  const t = text.trim().toUpperCase();
  if (!t) return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily;
  const font = `800 120px ${family}`;
  ctx.font = font;
  const pad = 24;
  const w = Math.ceil(ctx.measureText(t).width + pad * 2);
  const h = 150;
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(t, pad, h / 2 + 6);
  return { src: canvas.toDataURL("image/png"), w, h, kind: "text" };
}
