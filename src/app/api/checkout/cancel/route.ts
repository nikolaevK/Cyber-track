import { revalidateTag } from "next/cache";
import { getStore, SPOTS_TAG } from "@/lib/store";

/** Stripe sends a cancelled checkout here so the hold is released immediately instead of after 30 minutes. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const holdId = url.searchParams.get("hold");
  const back = url.searchParams.get("back") ?? "/";
  if (holdId) {
    await getStore().release(holdId);
    revalidateTag(SPOTS_TAG, { expire: 0 });
  }
  // Only ever bounce to a path on this site.
  const safe = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  return Response.redirect(new URL(`${safe}#configure`, req.url), 303);
}
