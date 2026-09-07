export type View =
  | "front"
  | "front34"
  | "side"
  | "rear34"
  | "rear"
  | "sidePassenger"
  | "top";

export interface ViewDef {
  id: View;
  label: string;
  src: string;
}

export const VIEW_LABELS: Record<View, string> = {
  front: "Front",
  front34: "Front ¾",
  side: "Driver side",
  rear: "Rear",
  rear34: "Rear ¾",
  sidePassenger: "Passenger side",
  top: "Top",
};

/** Standard set of angles every car is rendered in, in switcher order. */
export const VIEW_ORDER: View[] = ["front", "front34", "side", "rear", "rear34", "sidePassenger", "top"];

/** Builds the view list for a car from its render folder. */
export const viewsFor = (folder: string): ViewDef[] =>
  VIEW_ORDER.map((id) => ({
    id,
    label: VIEW_LABELS[id],
    src: `/renders/${folder}/${{ front: "front", front34: "front-34", side: "side-driver", rear: "rear", rear34: "rear-34", sidePassenger: "side-passenger", top: "top" }[id]}.jpg`,
  }));

/** Views that form a walk around the car (drag-to-rotate). Top is reached via the switcher only. */
export const ORBIT: View[] = ["front", "front34", "side", "rear", "rear34", "sidePassenger"];

export type Tier = "prime" | "standard" | "bargain";

export interface Spot {
  id: string;
  number: number;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  /** Approximate printable area on the car. */
  size: string;
  tier: Tier;
  /** The angle that shows this panel best. Thumbnails are cropped from it around the hotspot. */
  heroView: View;
}

/** A sponsorship lasts as long as the car does. */
export const TERM_LABEL = "Life of the car";

/** The next date sold panels get applied. */
export const WRAP_DATE = "2026-10-01T09:00:00Z";

/** Panels we wrapped ourselves. They are sold permanently and never touch the store. */
export interface HouseSponsor {
  name: string;
  url: string;
  logo: string;
  /** White cut-vinyl decal (transparent PNG) fitted inside the panel in the configurator. */
  decal: string;
  /** Photoreal renders of the finished wrap, first one is the lead image. */
  renders: { src: string; alt: string }[];
}
