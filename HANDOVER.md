# Handover — Brand My Garage

Next.js site that sells fixed-price advertising panels on three cars (Tesla Cybertruck, Mercedes-Benz G 550,
Porsche 911 GT3) through Stripe Checkout. Built 2026-09-02 → 2026-09-04 with Claude Code. This file is the
state of play for whoever picks it up next. `README.md` covers setup; this covers decisions and loose ends.

## Run and verify

```bash
npm run dev          # http://localhost:3000 — add ?debug=1 to overlay the hotspot grid
npx tsc --noEmit && npm run lint && npm run build   # all three pass as of handover
```

After replacing or swapping a file in `public/renders/`, delete `.next/dev/cache/images` and reload: the dev
image optimizer caches every width/format for 4 hours (`minimumCacheTTL` default) and will keep serving the
old pixels under the same URL, which is easy to mistake for a hotspot bug.

Without `STRIPE_SECRET_KEY` the checkout runs a **development-only demo mode** (spot is marked sold instantly
and you land on `/success`). Without `TURSO_DATABASE_URL` spot state lives in `.data/spots.db` (git-ignored SQLite).
Delete that file to reset purchases. See `.env.example`.

## What the user asked for, in order (and the constraints that stuck)

1. A page inspired by https://brand-my-gt3rs.pages.dev/ (Manrope, white canvas, huge tight headline, per-spot
   rows), plus interactivity from https://brandmytesla.eu/ (rotatable car with clickable panels) and
   https://brandmyass.site/ (logo upload, stats, FAQ). Cybertruck instead of a GT3 RS. Stripe payments.
2. Outlines must **follow the real panel shape** and never extend past the body (user flagged this twice).
3. More panels: 12 → 20 on the Cybertruck.
4. Prices must **add up to the car's new price**. Term is the **life of the car**, not 12 months.
5. Nose panel is a house sponsorship for **Peptide Ads** (peptideads.com, the user's brand). User rejected a
   full blue panel wrap: **white wordmark only, as a cut decal on bare steel**, and the on-site overlay must
   conform to the panel outline (it is clip-path'ed to the polygon).
6. Two more cars as tabs, same fidelity: G-Wagon and 911 GT3.

## Architecture

- `src/lib/cars.ts` — car registry (`CARS`, `carBySlug`, `storeKey`, price assertion at import time).
- `src/lib/cars/<car>.ts` — catalog (spots, prices, sizes, best angle), render paths, house sponsors.
- `src/lib/cars/<car>.hotspots.ts` — clickable polygons + logo quads per view, in a 1000 × 558 space.
  **Generated** by `tools/hotspots` (see its README); don't hand-edit numbers.
- `src/lib/spots.ts` — shared types, `VIEW_ORDER`, `ORBIT` (drag-to-rotate ring), `TERM_LABEL`, `WRAP_DATE`.
- `src/lib/geometry.ts` — `fitQuad`, `centroid`, `viewsShowing`. `src/lib/homography.ts` — 4-point → `matrix3d`.
- `src/lib/store.ts` — Turso/libSQL (`@libsql/client`); the same code uses `file:.data/spots.db` locally.
  Schema in `db/schema.sql` (applied on first use and by `npm run db:migrate`). Keys are `${carId}:${spotId}`.
  Holds are atomic (`ON CONFLICT … WHERE status='available' OR expired`). Expired holds read as available.
- `src/lib/public.ts` — what the browser may see (never the contact email); merges house sponsors as sold.
- `src/components/CarPage.tsx` — the whole page for one car. Routes: `app/page.tsx` (default car) and
  `app/[car]/page.tsx` (`/g-wagon`, `/gt3`, `/cybertruck`). Both `force-dynamic`.
- `src/components/Configurator.tsx` — renders, drag/arrow rotation, SVG hotspots (paired polygons via
  `extra`), perspective logo preview and sponsor overlays inside `PanelClip`, detail card.
- `src/app/api/checkout` — validate → hold → Stripe Checkout Session (31-min expiry, hold 32 min) → redirect.
  `cancel/route.ts` releases the hold and bounces to the car page. `api/webhooks/stripe` marks sold/released.
  `/success` also confirms `payment_status === "paid"` itself, so local dev works without the webhook.

## Prices (all before destination/delivery, checked 2026-09-04)

| Car | Total | Source |
|---|---|---|
| Cybertruck (20 spots) | $74,990 | tesla.com/cybertruck/design, Dual Motor AWD vehicle price |
| G 550 (18 spots) | $153,900 | Mercedes-Benz USA MSRP (KBB shows $155,050 incl. $1,150 destination) |
| 911 GT3 (18 spots) | $224,750 | Porsche USA base MSRP (KBB) |

## Render provenance (Higgsfield MCP, model `nano_banana_2`, 2k, 16:9)

Each car has one hero (front ¾, driver side, nose left) used as `image_references` for the other six angles:

- Cybertruck hero job `9318d41f-09a9-481e-85c8-373a58a6f026`. Driver-side profile is a mirrored render
  (the model produced nose-right twice).
- G-Wagon hero `2eec4703-60aa-4f7e-bf5c-a9d10e3dafec` (selenite grey, black wheels).
- GT3 hero `2e22fabd-8f30-4530-be49-9b57ba26d64f` (GT Silver; re-rendered because the first pass had a
  carbon front lid). The two GT3 side profiles came out swapped. Fixed 2026-09-04: `side-driver` now shows the
  nose on the left and `side-passenger` on the right, the same convention as the other two cars, and the
  tracing assets/cutouts in `tools/hotspots/assets/gt3` were swapped together with `public/renders/gt3`.
- Peptide Ads decal renders used the base render + a white-on-charcoal wordmark sheet
  (media `4bfaeb88-dde0-4799-b5a4-ae153ae57868`) with the prompt stating the dark background is not part of
  the design. Variants that spilled colour onto the hood or dimmed the light bar were rejected.
- The model often ignores "nose pointing left/right". Always check with a contact sheet (`sheet.mjs`).

Full-res source PNGs and background cutouts are in `tools/hotspots/assets/` (git-ignored). If lost,
re-run Higgsfield `remove_background` on the job ids above and re-download.

## Hotspot workflow (the part most likely to need touching)

Eyeballing an edge against the white studio is unreliable where bright paint meets white (the Cybertruck
roofline read ~30 units too high that way). The reliable loop is in `tools/hotspots/README.md`:
hand-trace on a grid crop → `clip.mjs` (3-unit inset inside the alpha silhouette) → `gen.mjs` →
`review.mjs` with `CUT=1` (magenta background makes spills obvious). Thumbnails in the rate card are
derived from the hotspot bounding boxes, so fixing a polygon fixes its thumbnail too.

For a full retrace, write the raw outlines as `{view: {id: {poly, quad, extra?}}}` JSON and point
`HOTSPOTS_JSON=<file>` at it: `clip.mjs` and `review.mjs` both read it instead of the generated TS.
The G-Wagon and GT3 outlines were retraced this way on 2026-09-04 so every hotspot follows its real
panel: doors stop at the wheel-arch cut-outs, fenders end at the arches and headlights, the G-Wagon
tailgate wraps around the spare and the rear window is cut by it, the GT3 lid is the shield between the
headlights, the wing blade and end plates are separate, and tail-light bars are excluded. Camera
perspective differs per render (the passenger-side G-Wagon sits ~15 units higher than the driver side),
so never copy a polygon from one view to its mirror view.

## Not done / decide next

- **Live Stripe key is in `.env.local` (2026-09-04) and the checkout path is verified**: `POST /api/checkout`
  created a real Checkout Session whose line item was the catalog price, and the cancel route released the
  hold. The store moved from Postgres to Turso/SQLite on 2026-09-07; the old `.data/spots.json` was removed.
- **Production prep done 2026-09-07** (GitHub remote `nikolaevK/Cyber-track`, Vercel with a temporary domain):
  README "Production setup" is the checklist. Still needs a human: import on Vercel, add Turso, set
  `STRIPE_SECRET_KEY`, run `npm run stripe:webhook -- https://<domain>` and set `STRIPE_WEBHOOK_SECRET`,
  run `tools/vercel/firewall-rules.sh` after `npx vercel link`. The Vercel CLI is not installed globally;
  `npx vercel@latest` works. `vercel login`/`link` are interactive, so they must be run by a person.

## Abuse / DDoS review (2026-09-07)

Vercel mitigates volumetric L3/L4/L7 floods for free and does not bill blocked traffic, so the review
focused on what a modest, well-formed request stream could do to *this* app.

| # | Vector | Status |
|---|---|---|
| 1 | **Hold exhaustion.** `POST /api/checkout` is unauthenticated; 56 requests hold every panel for ~32 min and a loop keeps the store unsellable. | **Open.** Mitigate with the staged WAF rate limit (10/min/IP on `POST /api/checkout`), Attack Challenge Mode if it happens, and consider a per-IP active-hold cap in the DB. Holds are released the moment Stripe reports `expired`. |
| 2 | Oversized bodies to `/api/checkout` (Vercel accepts up to 100 MB). | Fixed: `Content-Length` over 2 MB is rejected with 413 before the body is read. |
| 3 | `/success?session_id=…` flood, one Stripe API call per hit against Stripe's 100 req/s live limit. | Reduced: ids must match `cs_(live|test)_…` before Stripe is called. WAF rule stages 20/min/IP. |
| 4 | Every page view queried the database (`force-dynamic`). | Fixed: `listSpotStates` is `unstable_cache`d under tag `spots`, invalidated on every hold/complete/release, 60 s backstop. |
| 5 | Webhook. | Already safe: signature verified via `constructEvent` before any work; 503 without secret, 400 on bad signature; `complete` is idempotent. |
| 6 | `GET /api/checkout/cancel?hold=…` releases holds. | Acceptable: hold ids are UUIDv4, only `pending` rows are touched, redirect is same-origin only. |
| 7 | Image optimizer (`/_next/image`). | Bounded: local images only, default size/quality allow-lists. |
| 8 | Sponsor logos are stored as data URLs (≤1.5 MB) and inlined into every page render once sold. | **Open, performance not security.** With many sold panels pages get very heavy. Move logos to Vercel Blob (or a cached `/api/logo/...` route) before many sales. |
| 9 | Production without `TURSO_DATABASE_URL` would show all panels available and 500 at checkout. | Fixed: the store throws at startup in production. |
| 10 | Response headers. | Fixed: nosniff, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`, referrer and permissions policies in `next.config.ts`. Full CSP deferred (needs nonces for Next/Motion inline code). |
- **Stripe catalog exists in LIVE mode only** (created 2026-09-04 via the Stripe MCP connector on the
  Agency Collective LLC account): 56 products `bmg-<car>-<spot>`, each with a one-time USD default price
  matching `src/lib/cars/`. Test mode has none; run `npm run stripe:sync` with an `sk_test_` key to mirror
  them (`--dry-run` to preview). Re-run it in either mode whenever a price changes; it reprices in place.
- **Nothing committed.** The repo has only create-next-app's initial commit; all work is uncommitted.
- Peptide Ads decal exists only on the Cybertruck nose; the other cars have no house sponsor.
- FAQ's "life of the car" clause (pro-rata refund if the car leaves the road within three years) is my
  suggestion, not the user's.
- Site name is "Brand my garage" (my choice once there were three cars); easy to rename in `Nav`/`Footer`.
- All seven views of the G-Wagon and GT3 pages were checked in a foreground Chrome window with `?debug=1`
  on 2026-09-04 after the retrace (outlines sit on the panels, GT3 driver/passenger read correctly). Still
  pending: click a panel, type a brand name, buy in demo mode, check `/success`; mobile check of both cars.
- Renders for the "how it works" cards use fixed crop positions tuned for the truck; they look fine on the
  other cars but were not individually tuned.
