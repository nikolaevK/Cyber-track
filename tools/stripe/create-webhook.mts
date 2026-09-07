/**
 * Registers the site's Stripe webhook endpoint for a given public origin and prints the signing
 * secret once. Stripe never shows that secret again, so paste it into Vercel straight away:
 *
 *   STRIPE_SECRET_KEY=sk_live_... npm run stripe:webhook -- https://your-site.vercel.app
 *
 * Reads `.env.local` when present. Re-running with the same origin reuses the existing endpoint
 * (and cannot print its secret; roll it in the Stripe dashboard if lost).
 */
import Stripe from "stripe";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the environment.
}

const origin = process.argv[2];
if (!origin || !/^https:\/\/[^/\s]+$/.test(origin)) {
  console.error("Usage: npm run stripe:webhook -- https://<your-domain>   (https, no path)");
  process.exit(1);
}
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set (put it in .env.local or the environment).");
  process.exit(1);
}

const stripe = new Stripe(key);
const url = `${origin}/api/webhooks/stripe`;
const enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
];

const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find((e) => e.url === url);
if (existing) {
  console.log(`Endpoint already exists: ${existing.id} (${existing.status}) -> ${url}`);
  console.log("Its secret cannot be shown again. Roll it in the Stripe dashboard if you no longer have it.");
  process.exit(0);
}

const endpoint = await stripe.webhookEndpoints.create({
  url,
  enabled_events,
  description: "Brand my garage — checkout session events",
});

console.log(`Created ${endpoint.id} -> ${url}`);
console.log(`Events: ${enabled_events.join(", ")}`);
console.log("\nSet this in Vercel (Production) as STRIPE_WEBHOOK_SECRET, then redeploy:\n");
console.log(endpoint.secret);
