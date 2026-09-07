# Hotspot tooling

Node scripts (need `sharp`, installed as a devDependency) that keep the clickable panel
outlines in `src/lib/cars/<car>.hotspots.ts` accurate. Run from the repo root with
`CAR=cybertruck|gwagon|gt3`.

- `review.mjs '[["front34",60,120,940,470,"name"], ...]'` — renders a crop of a view with a
  coordinate grid and the current polygons (green) and logo quads (orange dashed) into
  `out/name.jpg`. Add `CUT=1` to draw over the background-removed cutout on magenta, which
  makes any outline that spills off the body obvious. Coordinates are the 1000 × 558 space
  used by every view.
- `clip.mjs` — pushes every polygon and quad 3 units inside the car's silhouette (from the
  `assets/<car>/cut-*.png` cutouts) and writes `hotspots.<car>.clipped.json`. Like `review.mjs`
  it reads `HOTSPOTS_JSON=<file>` (raw `{view: {id: {poly, quad, extra?}}}`) instead of the
  generated TS when set, which is the easiest way to feed a full retrace.
- `gen.mjs` — writes `src/lib/cars/<car>.hotspots.ts` from that JSON. Run prettier after.
- `sheet.mjs out.jpg cols img...` — contact sheet, cheap way to eyeball many renders.
- `wrap.mjs`, `decal.mjs` — build the Peptide Ads nose artwork (blue wrap, and the white
  wordmark decal actually used) from `brand/`.

Workflow for a new or changed panel: edit the polygon by hand (read coordinates off a
`review.mjs` grid crop), then `clip.mjs` → `gen.mjs` → `review.mjs` with `CUT=1` to confirm.
Never trust an eyeballed edge where bright paint meets the white studio; that is exactly
where the clipper earns its keep.

`assets/` holds the full-resolution source renders and cutouts (git-ignored, ~300 MB). If
they are missing, regenerate the cutouts with Higgsfield `remove_background` on the render
job ids listed in `HANDOVER.md`.
