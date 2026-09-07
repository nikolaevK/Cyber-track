import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

/** Demo checkout is only ever allowed outside production. */
export const demoCheckoutAllowed = () =>
  !stripeConfigured() && process.env.NODE_ENV !== "production";

export const HOLD_MINUTES = 30;
