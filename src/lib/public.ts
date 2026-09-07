import type { SpotState, SpotStatus } from "./store";
import { effectiveStatus } from "./store";
import { storeKey, type Car } from "./cars";

/** What the browser is allowed to see about a spot's state. Never includes the contact email. */
export interface PublicSpotState {
  spotId: string;
  status: SpotStatus;
  sponsorName: string | null;
  sponsorUrl: string | null;
  /** Image URL for the sponsor logo: a static file for house sponsors, /api/logo/... for uploads. */
  logoSrc: string | null;
  paidAt: string | null;
  /** White cut-vinyl decal, transparent PNG (house sponsors only). */
  decal?: string;
  /** Photoreal renders of the finished wrap (house sponsors only). */
  renders?: { src: string; alt: string }[];
}

export function toPublicStates(car: Car, rows: SpotState[]): Record<string, PublicSpotState> {
  const byKey = new Map(rows.map((r) => [r.spotId, r]));
  const out: Record<string, PublicSpotState> = {};
  for (const spot of car.spots) {
    const house = car.house[spot.id];
    if (house) {
      out[spot.id] = {
        spotId: spot.id,
        status: "sold",
        sponsorName: house.name,
        sponsorUrl: house.url,
        logoSrc: house.logo,
        paidAt: null,
        decal: house.decal,
        renders: house.renders,
      };
      continue;
    }
    const r = byKey.get(storeKey(car, spot.id));
    const status = r ? effectiveStatus(r) : "available";
    const visible = status !== "available";
    out[spot.id] = {
      spotId: spot.id,
      status,
      sponsorName: visible ? (r?.sponsorName ?? null) : null,
      sponsorUrl: visible ? (r?.sponsorUrl ?? null) : null,
      // Uploaded logos are served from the database by /api/logo, versioned so the CDN can cache forever.
      logoSrc: visible && r?.logoDataUrl ? `/api/logo/${car.slug}/${spot.id}?v=${Date.parse(r.updatedAt)}` : null,
      paidAt: status === "sold" ? (r?.paidAt ?? null) : null,
    };
  }
  return out;
}
