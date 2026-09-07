import { revalidateTag } from "next/cache";
import { carById, carPath, spotOf, storeKey, viewOf } from "@/lib/cars";
import { getStore, SPOTS_TAG } from "@/lib/store";
import { demoCheckoutAllowed, getStripe, HOLD_MINUTES, stripeConfigured } from "@/lib/stripe";
import { stripeProductDescription, stripeProductId, stripeProductName } from "@/lib/stripe-catalog";
import type { Car } from "@/lib/cars";
import type { Spot } from "@/lib/spots";

const MAX_LOGO = 1_500_000;
/** Logo data URL plus form fields, with headroom. Anything bigger is rejected before it is read. */
const MAX_BODY = 2_000_000;
const bad = (error: string, status = 400) => Response.json({ error }, { status });

function siteOrigin(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

/**
 * The catalog price for this panel (created by `npm run stripe:sync`), or null when it is
 * missing or disagrees with the site, in which case the session carries an inline price
 * so the customer is always charged what the page showed.
 */
async function catalogPriceId(car: Car, spot: Spot): Promise<string | null> {
  try {
    const product = await getStripe().products.retrieve(stripeProductId(car, spot), { expand: ["default_price"] });
    const price = product.default_price;
    if (
      product.active &&
      price &&
      typeof price !== "string" &&
      price.active &&
      price.currency === "usd" &&
      price.unit_amount === spot.priceCents &&
      !price.recurring
    ) {
      return price.id;
    }
    console.warn(`[checkout] Stripe product ${product.id} does not match the site price; using an inline price`);
  } catch {
    console.warn(`[checkout] Stripe product ${stripeProductId(car, spot)} not found; run npm run stripe:sync`);
  }
  return null;
}

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0 || length > MAX_BODY) return bad("Request too large.", 413);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return bad("Invalid request.");

  const carId = String(body.carId ?? "");
  const spotId = String(body.spotId ?? "");
  const sponsorName = String(body.sponsorName ?? "").trim();
  const sponsorUrl = String(body.sponsorUrl ?? "").trim();
  const email = String(body.email ?? "").trim();
  const logoDataUrl = typeof body.logoDataUrl === "string" ? body.logoDataUrl : null;

  const car = carById(carId);
  if (!car) return bad("Unknown car.", 404);
  const spot = spotOf(car, spotId);
  if (!spot) return bad("Unknown spot.", 404);
  if (car.house[spotId]) return bad("That spot is already taken.", 409);
  if (sponsorName.length < 2 || sponsorName.length > 60) return bad("Brand name should be 2–60 characters.");
  let url: URL;
  try {
    url = new URL(sponsorUrl);
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    return bad("Enter a valid website, starting with https://");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return bad("Enter a valid email.");
  if (logoDataUrl !== null) {
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logoDataUrl)) return bad("Logo must be a PNG, JPEG or WebP.");
    if (logoDataUrl.length > MAX_LOGO) return bad("Logo is too large. Keep it under about 1 MB.");
  }

  const store = getStore();
  const holdId = crypto.randomUUID();
  const held = await store.hold({
    spotId: storeKey(car, spotId),
    holdId,
    sponsorName,
    sponsorUrl: url.toString(),
    logoDataUrl,
    contactEmail: email,
    pendingUntil: new Date(Date.now() + (HOLD_MINUTES + 2) * 60_000),
  });
  if (!held) return bad("That spot was just taken. Pick another one.", 409);

  const origin = siteOrigin(req);

  if (!stripeConfigured()) {
    if (!demoCheckoutAllowed()) {
      await store.release(holdId);
      return bad("Payments are not configured yet. Add STRIPE_SECRET_KEY to enable checkout.", 503);
    }
    await store.complete(holdId);
    revalidateTag(SPOTS_TAG, { expire: 0 });
    return Response.json({ url: `/success?hold=${holdId}`, demo: true });
  }

  try {
    const priceId = await catalogPriceId(car, spot);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: holdId,
      line_items: [
        priceId
          ? { quantity: 1, price: priceId }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: spot.priceCents,
                product_data: {
                  name: stripeProductName(car, spot),
                  description: stripeProductDescription(car, spot),
                  images: [`${origin}${viewOf(car, spot.heroView).src}`],
                },
              },
            },
      ],
      metadata: { carId, spotId, holdId, sponsorName, sponsorUrl: url.toString() },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/api/checkout/cancel?hold=${holdId}&back=${encodeURIComponent(carPath(car))}`,
      // Stripe requires at least 30 minutes; the extra minute guards against clock skew.
      expires_at: Math.floor(Date.now() / 1000) + (HOLD_MINUTES + 1) * 60,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    // The hold is live: show the panel as pending to everyone else right away.
    revalidateTag(SPOTS_TAG, { expire: 0 });
    return Response.json({ url: session.url });
  } catch (err) {
    await store.release(holdId);
    console.error("[checkout] Stripe session failed", err);
    return bad("Could not start checkout. Please try again.", 502);
  }
}
