import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CAR = process.env.CAR ?? "cybertruck";
const CARCFG = {
  cybertruck: { dir: path.join(__dirname, "assets", "cybertruck"), files: { front34: "hero-a", front: "front", side: "side-driver-mirrored", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "cybertruck.hotspots.ts"), exportName: "CYBERTRUCK_HOTSPOTS" },
  gwagon: { dir: path.join(__dirname, "assets", "gwagon"), files: { front34: "front-34", front: "front", side: "side-driver", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "gwagon.hotspots.ts"), exportName: "GWAGON_HOTSPOTS" },
  gt3: { dir: path.join(__dirname, "assets", "gt3"), files: { front34: "front-34", front: "front", side: "side-driver", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "gt3.hotspots.ts"), exportName: "GT3_HOTSPOTS" },
}[CAR];

const SRC = process.env.HOTSPOTS_JSON;
const HOTSPOTS = SRC ? JSON.parse(fs.readFileSync(SRC, "utf8")) : (await import(CARCFG.ts))[CARCFG.exportName];

const W = 2752, H = 1536, K = W / 1000;
const S = 0.5;                       // work at half resolution
const R = CARCFG.dir;
const O = path.join(__dirname, "out");
const FILE = CARCFG.files;
const MARGIN_UNITS = 3;              // keep outlines this far inside the silhouette

const CUT = { front34: "cut-front34", front: "cut-front", side: "cut-side", sidePassenger: "cut-sidePassenger", rear: "cut-rear", rear34: "cut-rear34", top: "cut-top" };

/** Silhouette from the background-removed cutout's alpha channel, eroded by the margin. */
async function silhouette(view) {
  const { data, info } = await sharp(path.join(R, CUT[view] + ".png")).resize(Math.round(W * S)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const bg = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) bg[i] = data[i * 4 + 3] < 128 ? 1 : 0;
  const r = Math.round(MARGIN_UNITS * K * S);
  const disk = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) disk.push([dx, dy]);
  const inside = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (bg[i]) continue;
    let ok = 1;
    for (const [dx, dy] of disk) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h || bg[yy * w + xx]) { ok = 0; break; }
    }
    inside[i] = ok;
  }
  return { inside, bg, w, h };
}

const toPx = ([x, y]) => [x * K * S, y * K * S];
const toUnits = ([x, y]) => [x / (K * S), y / (K * S)];
const isInside = (m, [x, y]) => { const xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < m.w && yi < m.h && m.inside[yi * m.w + xi] === 1; };
function nearestInside(m, [x, y], maxR = 80) {
  let best = null, bestD = Infinity;
  const xi = Math.round(x), yi = Math.round(y);
  for (let rad = 1; rad <= maxR; rad++) {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
      const p = [xi + dx, yi + dy];
      if (isInside(m, p)) { const d = dx * dx + dy * dy; if (d < bestD) { bestD = d; best = p; } }
    }
    if (best && rad > Math.sqrt(bestD)) break;
  }
  return best;
}
function simplify(pts, tol) { // Douglas–Peucker on an open polyline
  if (pts.length <= 2) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = -1, maxD = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [a, b];
  const l = simplify(pts.slice(0, idx + 1), tol), r = simplify(pts.slice(idx), tol);
  return [...l.slice(0, -1), ...r];
}
function clipPolygon(m, poly, log) {
  // 1) vertices
  let pts = poly.map((p) => {
    const px = toPx(p);
    if (isInside(m, px)) return p;
    const n = nearestInside(m, px);
    if (!n) return p;
    const u = toUnits(n);
    log.push(`  vertex (${p[0]},${p[1]}) -> (${u[0].toFixed(0)},${u[1].toFixed(0)})`);
    return u;
  });
  // 2) edges: snap outside samples inward and simplify
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const apx = toPx(a), bpx = toPx(b);
    const len = Math.hypot(bpx[0] - apx[0], bpx[1] - apx[1]);
    const n = Math.max(2, Math.ceil(len / 2));
    const line = [a];
    let bad = 0;
    for (let s = 1; s < n; s++) {
      const t = s / n;
      const p = [apx[0] + (bpx[0] - apx[0]) * t, apx[1] + (bpx[1] - apx[1]) * t];
      if (isInside(m, p)) { line.push(toUnits(p)); continue; }
      const q = nearestInside(m, p);
      bad++;
      line.push(q ? toUnits(q) : toUnits(p));
    }
    line.push(b);
    const simp = bad ? simplify(line, 1.2) : [a, b];
    if (bad) log.push(`  edge ${i}: ${bad} samples outside -> ${simp.length - 2} extra vertices`);
    out.push(...simp.slice(0, -1));
  }
  return out.map(([x, y]) => [Math.round(x), Math.round(y)]);
}
function clipQuad(m, quad, log) {
  return quad.map((p) => {
    const px = toPx(p);
    if (isInside(m, px)) return p;
    const n = nearestInside(m, px);
    if (!n) return p;
    const u = toUnits(n).map((v) => Math.round(v));
    log.push(`  quad (${p[0]},${p[1]}) -> (${u[0]},${u[1]})`);
    return u;
  });
}

const result = {};
for (const view of Object.keys(HOTSPOTS)) {
  const m = await silhouette(view);
  // Debug overlay: eroded silhouette in green, background in red tint.
  const rgba = Buffer.alloc(m.w * m.h * 4);
  for (let i = 0; i < m.w * m.h; i++) { rgba[i * 4] = m.bg[i] ? 255 : 0; rgba[i * 4 + 1] = m.inside[i] ? 200 : 0; rgba[i * 4 + 2] = 0; rgba[i * 4 + 3] = m.bg[i] ? 60 : m.inside[i] ? 70 : 0; }
  const overlay = await sharp(rgba, { raw: { width: m.w, height: m.h, channels: 4 } }).png().toBuffer();
  await sharp(path.join(R, FILE[view] + ".png")).resize(m.w).composite([{ input: overlay }]).resize({ width: 1400 }).jpeg({ quality: 80 }).toFile(path.join(O, `mask-${CAR}-${view}.jpg`));

  result[view] = {};
  for (const [id, hs] of Object.entries(HOTSPOTS[view])) {
    const log = [];
    const poly = clipPolygon(m, hs.poly, log);
    const quad = clipQuad(m, hs.quad, log);
    const extra = hs.extra ? hs.extra.map((p) => clipPolygon(m, p, log)) : undefined;
    result[view][id] = { poly, quad, ...(extra ? { extra } : {}) };
    if (log.length) console.log(`${view}/${id}\n${log.join("\n")}`);
  }
}
fs.writeFileSync(path.join(__dirname, `hotspots.${CAR}.clipped.json`), JSON.stringify(result));
console.log("done");
