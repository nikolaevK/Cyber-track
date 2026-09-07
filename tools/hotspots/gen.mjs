import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAR = process.env.CAR ?? "cybertruck";
const OUT = { cybertruck: [path.join(__dirname, "..", "..", "src", "lib", "cars", "cybertruck.hotspots.ts"), "CYBERTRUCK_HOTSPOTS"], gwagon: [path.join(__dirname, "..", "..", "src", "lib", "cars", "gwagon.hotspots.ts"), "GWAGON_HOTSPOTS"], gt3: [path.join(__dirname, "..", "..", "src", "lib", "cars", "gt3.hotspots.ts"), "GT3_HOTSPOTS"] }[CAR];
const data = JSON.parse(fs.readFileSync(path.join(__dirname, `hotspots.${CAR}.clipped.json`), "utf8"));

// Logo quads that the clipper collapsed where a panel tapers to a point.
const QUAD_OVERRIDES = CAR !== "cybertruck" ? {} : {
  "front34/driver-sail": [[722, 190], [800, 208], [800, 224], [722, 216]],
  "rear34/rear-bumper": [[140, 352], [380, 352], [380, 400], [158, 385]],
  "top/passenger-sail": [[470, 403], [700, 408], [700, 415], [470, 414]],
  "top/driver-sail": [[470, 153], [860, 153], [860, 165], [470, 176]],
};
const COMMENTS = CAR !== "cybertruck" ? {} : {
  "top/hood": "// Reads from the front of the truck, so it is rotated 90° in this view.",
  "top/windshield": "// Rotated with the hood so the banner reads from the front.",
};
const VIEW_TITLES = {
  front34: "front ¾ (hero)", front: "front", side: "driver side", sidePassenger: "passenger side",
  rear: "rear", rear34: "rear ¾", top: "top",
};
const fmt = (pts) => "[" + pts.map(([x, y]) => `[${x}, ${y}]`).join(", ") + "]";

let out = `import type { Quad, Pt } from "../homography";
import type { View } from "../spots";
import type { Hotspot } from "../geometry";

/**
 * Outlines were traced to the body seams, then clipped 3 units inside the car's
 * silhouette (from background-removed cutouts) so no stroke ever spills onto the studio.
 * Regenerate with the scratchpad grid tool rather than editing numbers by hand.
 */
const hs = (poly: Pt[], quad: Quad, extra?: Pt[][]): Hotspot => ({ poly, quad, extra });

export const ${OUT[1]}: Record<View, Record<string, Hotspot>> = {
`;
for (const [view, spots] of Object.entries(data)) {
  out += `  /* ${"-".repeat(30)} ${VIEW_TITLES[view]} ${"-".repeat(30)} */\n  ${view}: {\n`;
  for (const [id, h] of Object.entries(spots)) {
    const key = `${view}/${id}`;
    const quad = QUAD_OVERRIDES[key] ?? h.quad;
    const name = /^[a-z]+$/.test(id) ? id : `"${id}"`;
    if (COMMENTS[key]) out += `    ${COMMENTS[key]}\n`;
    out += `    ${name}: hs(\n      ${fmt(h.poly)},\n      ${fmt(quad)},\n`;
    if (h.extra) out += `      [${h.extra.map(fmt).join(", ")}],\n`;
    out += `    ),\n`;
  }
  out += `  },\n\n`;
}
out = out.replace(/\n\n$/, "\n");
out += `};\n`;
fs.writeFileSync(OUT[0], out);
console.log("hotspots.ts written,", out.split("\n").length, "lines");
