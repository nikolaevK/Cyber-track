import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "node:fs";

const CAR = process.env.CAR ?? "cybertruck";
const CARCFG = {
  cybertruck: { dir: path.join(__dirname, "assets", "cybertruck"), files: { front34: "hero-a", front: "front", side: "side-driver-mirrored", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "cybertruck.hotspots.ts"), exportName: "CYBERTRUCK_HOTSPOTS" },
  gwagon: { dir: path.join(__dirname, "assets", "gwagon"), files: { front34: "front-34", front: "front", side: "side-driver", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "gwagon.hotspots.ts"), exportName: "GWAGON_HOTSPOTS" },
  gt3: { dir: path.join(__dirname, "assets", "gt3"), files: { front34: "front-34", front: "front", side: "side-driver", sidePassenger: "side-passenger", rear: "rear", rear34: "rear-34", top: "top" }, ts: path.join(__dirname, "..", "..", "src", "lib", "cars", "gt3.hotspots.ts"), exportName: "GT3_HOTSPOTS" },
}[CAR];

const SRC = process.env.HOTSPOTS_JSON;
const HOTSPOTS = SRC ? JSON.parse(fs.readFileSync(SRC, "utf8")) : (await import(CARCFG.ts))[CARCFG.exportName];
const CUT = { front34: "cut-front34", front: "cut-front", side: "cut-side", sidePassenger: "cut-sidePassenger", rear: "cut-rear", rear34: "cut-rear34", top: "cut-top" };
const W = 2752, H = 1536, k = W / 1000;
const R = CARCFG.dir;
const O = path.join(__dirname, "out");
const FILE = CARCFG.files;

export async function review(view, x0, y0, x1, y1, out, { grid = true, cut = !!process.env.CUT } = {}) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  if (grid) {
    for (let u = 0; u <= 1000; u += 10) {
      const x = u * k, major = u % 50 === 0;
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${major ? "rgba(255,0,0,0.7)" : "rgba(255,0,0,0.22)"}" stroke-width="${major ? 2 : 1}"/>`;
      if (major) svg += `<text x="${x + 4}" y="${y0 * k + 24}" font-size="22" font-weight="bold" font-family="Helvetica, Arial, sans-serif" fill="#d00">${u}</text>`;
    }
    for (let v = 0; v <= 560; v += 10) {
      const y = v * k, major = v % 50 === 0;
      svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${major ? "rgba(0,90,255,0.7)" : "rgba(0,90,255,0.22)"}" stroke-width="${major ? 2 : 1}"/>`;
      if (major) svg += `<text x="${x0 * k + 4}" y="${y - 4}" font-size="22" font-weight="bold" font-family="Helvetica, Arial, sans-serif" fill="#03c">${v}</text>`;
    }
  }
  for (const [id, hs] of Object.entries(HOTSPOTS[view] ?? {})) {
    const polys = [hs.poly, ...(hs.extra ?? [])];
    for (const poly of polys) {
      svg += `<polygon points="${poly.map(([x, y]) => `${x * k},${y * k}`).join(" ")}" fill="rgba(0,220,80,0.18)" stroke="#00c853" stroke-width="3"/>`;
    }
    const [cx, cy] = hs.poly.reduce((a, p) => [a[0] + p[0] / hs.poly.length, a[1] + p[1] / hs.poly.length], [0, 0]);
    svg += `<text x="${cx * k}" y="${cy * k}" font-size="20" font-weight="bold" font-family="Helvetica, Arial, sans-serif" fill="#006b2b" text-anchor="middle">${id}</text>`;
    const q = hs.quad;
    svg += `<polygon points="${q.map(([x, y]) => `${x * k},${y * k}`).join(" ")}" fill="none" stroke="#ff9800" stroke-width="2" stroke-dasharray="8 6"/>`;
  }
  svg += `</svg>`;
  const overlay = await sharp(Buffer.from(svg)).resize(W, H, { fit: "fill" }).png().toBuffer();
  const base = cut
    ? await sharp({ create: { width: W, height: H, channels: 3, background: "#ff33cc" } }).composite([{ input: path.join(R, CUT[view] + ".png") }]).png().toBuffer()
    : path.join(R, FILE[view] + ".png");
  const merged = await sharp(base).composite([{ input: overlay, top: 0, left: 0 }]).png().toBuffer();
  await sharp(merged)
    .extract({ left: Math.round(x0 * k), top: Math.round(y0 * k), width: Math.round((x1 - x0) * k), height: Math.round((y1 - y0) * k) })
    .resize({ width: 2000 })
    .jpeg({ quality: 86 })
    .toFile(path.join(O, out + ".jpg"));
  console.log("wrote", out);
}

const jobs = JSON.parse(process.argv[2] ?? "[]");
for (const j of jobs) await review(...j);
