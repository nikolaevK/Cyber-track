import type { Car } from "./cars";
import type { Spot } from "./spots";

/**
 * How a panel maps onto the Stripe product catalog. Shared by the checkout route and
 * `tools/stripe/sync-prices.mts`, which creates and updates the products. Product ids are
 * deterministic so the same code works against test and live keys without a lookup table.
 */
export const stripeProductId = (car: Car, spot: Spot) => `bmg-${car.id}-${spot.id}`;

export const stripeProductName = (car: Car, spot: Spot) => `${spot.name} · ${car.name}`;

export const stripeProductDescription = (car: Car, spot: Spot) =>
  `Sponsorship of the ${spot.name.toLowerCase()} (${spot.size}) for the life of the ${car.shortName}.`;
