import type { HotspotMap } from "./geometry";
import type { HouseSponsor, Spot, View, ViewDef } from "./spots";

export type CarId = "cybertruck" | "gwagon" | "gt3";

export interface Car {
  id: CarId;
  /** URL segment. The first car in CARS also lives at "/". */
  slug: string;
  make: string;
  name: string;
  shortName: string;
  headline: string;
  /** Follows "<N> " in the hero, e.g. "panels on a …". */
  blurb: string;
  /** New-car price the panels must add up to, in cents. */
  priceCents: number;
  /** Where that price came from, shown in the FAQ. */
  priceSource: string;
  views: ViewDef[];
  spots: Spot[];
  hotspots: HotspotMap;
  house: Record<string, HouseSponsor>;
}

import { cybertruck } from "./cars/cybertruck";
import { gwagon } from "./cars/gwagon";
import { gt3 } from "./cars/gt3";

export const CARS: Car[] = [cybertruck, gwagon, gt3];
export const DEFAULT_CAR = CARS[0];

for (const car of CARS) {
  const total = car.spots.reduce((sum, s) => sum + s.priceCents, 0);
  if (total !== car.priceCents) {
    throw new Error(`${car.name}: spot prices add up to ${total} cents, expected the car price ${car.priceCents}`);
  }
}

export const carById = (id: string): Car | undefined => CARS.find((c) => c.id === id);
export const carBySlug = (slug: string): Car | undefined => CARS.find((c) => c.slug === slug);
export const carPath = (car: Car) => (car.id === DEFAULT_CAR.id ? "/" : `/${car.slug}`);
export const spotOf = (car: Car, id: string): Spot | undefined => car.spots.find((s) => s.id === id);
export const viewOf = (car: Car, id: View): ViewDef => car.views.find((v) => v.id === id)!;
export const totalCents = (car: Car) => car.spots.reduce((sum, s) => sum + s.priceCents, 0);

/** Store keys are car-scoped so the same panel name on two cars never collides. */
export const storeKey = (car: Car, spotId: string) => `${car.id}:${spotId}`;
export const parseStoreKey = (key: string): { car: Car; spotId: string } | null => {
  const i = key.indexOf(":");
  if (i === -1) return null;
  const car = carById(key.slice(0, i));
  return car ? { car, spotId: key.slice(i + 1) } : null;
};
