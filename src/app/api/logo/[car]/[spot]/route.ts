import { carBySlug, spotOf, storeKey } from "@/lib/cars";
import { effectiveStatus, getStore } from "@/lib/store";

/**
 * Serves an uploaded sponsor logo straight from the database. Pages link here with a `?v=`
 * version (the row's updated_at) so the CDN can cache each version forever and pages stay small.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ car: string; spot: string }> }) {
  const { car: carSlug, spot: spotId } = await params;
  const car = carBySlug(carSlug);
  const spot = car ? spotOf(car, spotId) : undefined;
  if (!car || !spot) return new Response("Not found", { status: 404 });

  const row = await getStore().get(storeKey(car, spot.id));
  if (!row?.logoDataUrl || effectiveStatus(row) === "available") return new Response("Not found", { status: 404 });

  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(row.logoDataUrl);
  if (!m) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(m[2], "base64"), {
    headers: {
      "content-type": m[1],
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
