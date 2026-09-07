import type { Car } from "../cars";
import type { HotspotMap } from "../geometry";
import { viewsFor, type Spot } from "../spots";
import { GT3_HOTSPOTS } from "./gt3.hotspots";

const SPOTS: Spot[] = [
  { id: "wing", number: 1, name: "Rear wing", tagline: "The headline placement", description: "The swan-neck wing. The single most photographed part of the car, and the one every driver behind me reads.", priceCents: 3_400_000, size: "160 × 25 cm", tier: "prime", heroView: "rear34" },
  { id: "hood", number: 2, name: "Front lid", tagline: "Front and centre", description: "The frunk lid between the headlights. In every photo taken of the front of this car.", priceCents: 2_600_000, size: "110 × 90 cm", tier: "prime", heroView: "front34" },
  { id: "driver-door", number: 3, name: "Driver door", tagline: "Eye level, every stop", description: "The full door on the driver side, read by everyone I pull up beside.", priceCents: 1_800_000, size: "120 × 50 cm", tier: "prime", heroView: "side" },
  { id: "passenger-door", number: 4, name: "Passenger door", tagline: "The kerb side", description: "Faces the pavement, the cafés, and every phone camera on it.", priceCents: 1_800_000, size: "120 × 50 cm", tier: "prime", heroView: "sidePassenger" },
  { id: "roof", number: 5, name: "Roof", tagline: "Visible from above", description: "The roof panel between the windshield and the rear glass.", priceCents: 1_400_000, size: "120 × 100 cm", tier: "standard", heroView: "top" },
  { id: "decklid", number: 6, name: "Engine cover", tagline: "Under the wing", description: "The louvred engine cover beneath the wing. Seen by everyone behind me.", priceCents: 1_300_000, size: "100 × 40 cm", tier: "standard", heroView: "rear" },
  { id: "driver-fender", number: 7, name: "Driver front fender", tagline: "Over the front wheel", description: "The front wing from the headlight to the door on the driver side.", priceCents: 1_100_000, size: "80 × 40 cm", tier: "standard", heroView: "front34" },
  { id: "passenger-fender", number: 8, name: "Passenger front fender", tagline: "Over the other one", description: "The passenger side front wing. Same brief, kerb side.", priceCents: 1_100_000, size: "80 × 40 cm", tier: "standard", heroView: "sidePassenger" },
  { id: "driver-quarter", number: 9, name: "Driver rear quarter", tagline: "The wide hips", description: "The rear quarter panel over the wide rear wheel on the driver side.", priceCents: 1_200_000, size: "90 × 45 cm", tier: "standard", heroView: "side" },
  { id: "passenger-quarter", number: 10, name: "Passenger rear quarter", tagline: "Mirror of the above", description: "The passenger side rear quarter, kerb side exposure.", priceCents: 1_200_000, size: "90 × 45 cm", tier: "standard", heroView: "sidePassenger" },
  { id: "driver-skirt", number: 11, name: "Driver side skirt", tagline: "Low and long", description: "The sill below the driver door. Perfect for a long wordmark.", priceCents: 750_000, size: "150 × 12 cm", tier: "bargain", heroView: "side" },
  { id: "passenger-skirt", number: 12, name: "Passenger side skirt", tagline: "Low and long, kerb side", description: "The sill below the passenger door.", priceCents: 750_000, size: "150 × 12 cm", tier: "bargain", heroView: "sidePassenger" },
  { id: "windshield", number: 13, name: "Windshield banner", tagline: "Always in frame", description: "A strip across the top of the windshield, the classic race-car placement.", priceCents: 900_000, size: "120 × 12 cm", tier: "standard", heroView: "front" },
  { id: "front-bumper", number: 14, name: "Front bumper", tagline: "Low and forward", description: "The front fascia between the intakes.", priceCents: 900_000, size: "120 × 20 cm", tier: "standard", heroView: "front" },
  { id: "rear-bumper", number: 15, name: "Rear bumper", tagline: "The chasing view", description: "The rear fascia around the diffuser.", priceCents: 800_000, size: "120 × 18 cm", tier: "bargain", heroView: "rear" },
  { id: "wing-plates", number: 16, name: "Wing end plates", tagline: "A matched pair", description: "Both vertical end plates of the rear wing, wrapped as a pair.", priceCents: 500_000, size: "2 × 30 × 20 cm", tier: "bargain", heroView: "rear34" },
  { id: "mirrors", number: 17, name: "Mirror caps", tagline: "A matched pair", description: "Both mirror housings, wrapped as a pair.", priceCents: 475_000, size: "2 × 18 × 10 cm", tier: "bargain", heroView: "front34" },
  { id: "plate", number: 18, name: "Licence plate frame", tagline: "Your text, road rules permitting", description: "A custom frame around the rear plate with a line of your choosing.", priceCents: 500_000, size: "30 × 15 cm", tier: "bargain", heroView: "rear" },
];

export const gt3: Car = {
  id: "gt3",
  slug: "gt3",
  make: "Porsche",
  name: "Porsche 911 GT3",
  shortName: "GT3",
  headline: "Your brand on my GT3.",
  blurb:
    "panels on a 911 GT3 that gets driven, not stored. Pick one, drop your logo on it, pay once, and it rides for as long as the car does.",
  /** Porsche USA base MSRP for the 2026 911 GT3, before delivery and handling. */
  priceCents: 22_475_000,
  priceSource: "Porsche USA's base MSRP for a 2026 911 GT3",
  views: viewsFor("gt3"),
  spots: SPOTS,
  hotspots: GT3_HOTSPOTS as HotspotMap,
  house: {},
};
