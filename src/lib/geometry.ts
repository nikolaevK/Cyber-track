import type { Quad, Pt } from "./homography";
import type { View } from "./spots";

/** All geometry lives in a 1000 × 558 box that matches the 2752 × 1536 renders. */
export const VB = { w: 1000, h: 558 } as const;

export interface Hotspot {
  /** Clickable outline of the panel. */
  poly: Pt[];
  /** Where a logo goes: top-left, top-right, bottom-right, bottom-left in reading order. */
  quad: Quad;
  /** Additional outlines for spots that are a matched pair (mirror caps). */
  extra?: Pt[][];
}

export type HotspotMap = Record<View, Record<string, Hotspot>>;

export const viewsShowing = (hotspots: HotspotMap, spotId: string): View[] =>
  (Object.keys(hotspots) as View[]).filter((v) => hotspots[v]?.[spotId]);

export const centroid = (poly: Pt[]): Pt => {
  const n = poly.length;
  return [poly.reduce((a, p) => a + p[0], 0) / n, poly.reduce((a, p) => a + p[1], 0) / n];
};

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const bilerp = (q: Quad, u: number, v: number): Pt => {
  const [tl, tr, br, bl] = q;
  const top: Pt = [tl[0] + (tr[0] - tl[0]) * u, tl[1] + (tr[1] - tl[1]) * u];
  const bot: Pt = [bl[0] + (br[0] - bl[0]) * u, bl[1] + (br[1] - bl[1]) * u];
  return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
};

/** Shrinks a panel quad to a centred sub-quad with the logo's aspect ratio. */
export function fitQuad(quad: Quad, aspect: number, pad = 0.12): Quad {
  const [tl, tr, br, bl] = quad;
  const w = (dist(tl, tr) + dist(bl, br)) / 2;
  const h = (dist(tl, bl) + dist(tr, br)) / 2;
  const box = w / h;
  let fw = 1 - pad * 2;
  let fh = 1 - pad * 2;
  if (aspect > box) fh = (fw * box) / aspect;
  else fw = (fh * aspect) / box;
  const u0 = 0.5 - fw / 2;
  const u1 = 0.5 + fw / 2;
  const v0 = 0.5 - fh / 2;
  const v1 = 0.5 + fh / 2;
  return [bilerp(quad, u0, v0), bilerp(quad, u1, v0), bilerp(quad, u1, v1), bilerp(quad, u0, v1)];
}
