/**
 * Creates or updates one Stripe product per panel, each with a one-time USD default price
 * equal to the panel's price in `src/lib/cars`. Safe to re-run: existing products are
 * updated in place and a new price is only issued when the amount changed (the old price
 * is then deactivated). Run against test or live keys:
 *
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:sync
 *
 * Reads `.env.local` when present. Pass `--dry-run` to print the plan without writing.
 */
import Stripe from "stripe";
import { CARS } from "../../src/lib/cars";
import { stripeProductDescription, stripeProductId, stripeProductName } from "../../src/lib/stripe-catalog";

const dryRun = process.argv.includes("--dry-run");

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the environment.
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set (put it in .env.local or the environment).");
  process.exit(1);
}
const stripe = new Stripe(key);
const mode = key.startsWith("sk_live") ? "LIVE" : "test";
console.log(`Syncing ${CARS.reduce((n, c) => n + c.spots.length, 0)} panels to Stripe (${mode} mode)${dryRun ? ", dry run" : ""}\n`);

let created = 0;
let repriced = 0;
let unchanged = 0;

for (const car of CARS) {
  for (const spot of car.spots) {
    const id = stripeProductId(car, spot);
    const name = stripeProductName(car, spot);
    const description = stripeProductDescription(car, spot);
    const metadata = { site: "brand-my-garage", carId: car.id, spotId: spot.id };
    const label = `${id.padEnd(34)} $${(spot.priceCents / 100).toLocaleString("en-US")}`;

    let product: Stripe.Product | null = null;
    try {
      product = await stripe.products.retrieve(id, { expand: ["default_price"] });
    } catch (err) {
      if (!(err instanceof Stripe.errors.StripeError && err.statusCode === 404)) throw err;
    }

    if (!product) {
      console.log(`create   ${label}`);
      created++;
      if (dryRun) continue;
      await stripe.products.create({
        id,
        name,
        description,
        metadata,
        default_price_data: { currency: "usd", unit_amount: spot.priceCents, metadata },
      });
      continue;
    }

    const price = product.default_price as Stripe.Price | null;
    const priceOk = price?.active && price.currency === "usd" && price.unit_amount === spot.priceCents && !price.recurring;
    const detailsOk =
      product.active && product.name === name && product.description === description && product.metadata.carId === car.id && product.metadata.spotId === spot.id;

    if (priceOk && detailsOk) {
      console.log(`ok       ${label}`);
      unchanged++;
      continue;
    }

    console.log(`${priceOk ? "update  " : "reprice "} ${label}${price?.unit_amount != null ? ` (was $${(price.unit_amount / 100).toLocaleString("en-US")})` : ""}`);
    if (priceOk) unchanged++;
    else repriced++;
    if (dryRun) continue;

    const update: Stripe.ProductUpdateParams = { active: true, name, description, metadata };
    if (!priceOk) {
      const fresh = await stripe.prices.create({ product: id, currency: "usd", unit_amount: spot.priceCents, metadata });
      update.default_price = fresh.id;
    }
    await stripe.products.update(id, update);
    if (!priceOk && price) await stripe.prices.update(price.id, { active: false });
  }
}

console.log(`\ncreated ${created}, repriced ${repriced}, unchanged ${unchanged}`);
