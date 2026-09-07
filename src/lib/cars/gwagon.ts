import type { Car } from "../cars";
import type { HotspotMap } from "../geometry";
import { viewsFor, type Spot } from "../spots";
import { GWAGON_HOTSPOTS } from "./gwagon.hotspots";

const SPOTS: Spot[] = [
  { id: "spare-cover", number: 1, name: "Spare wheel cover", tagline: "The billboard", description: "The round cover on the rear door. Dead centre, eye level, and the first thing every driver behind me reads.", priceCents: 2_200_000, size: "80 cm across", tier: "prime", heroView: "rear" },
  { id: "hood", number: 2, name: "Hood", tagline: "Flat and enormous", description: "The famously flat G-Class hood, visible from every overpass, balcony and drone.", priceCents: 1_600_000, size: "140 × 110 cm", tier: "prime", heroView: "front34" },
  { id: "driver-front-door", number: 3, name: "Driver front door", tagline: "Eye level, every stop", description: "A tall, perfectly flat door. The best canvas on the car for a large logo.", priceCents: 1_150_000, size: "110 × 75 cm", tier: "prime", heroView: "side" },
  { id: "driver-rear-door", number: 4, name: "Driver rear door", tagline: "Right behind it", description: "Same height as the front door, a little narrower, same traffic.", priceCents: 950_000, size: "90 × 75 cm", tier: "prime", heroView: "side" },
  { id: "passenger-front-door", number: 5, name: "Passenger front door", tagline: "The kerb side", description: "Faces the pavement, the cafés, and every phone camera on it.", priceCents: 1_150_000, size: "110 × 75 cm", tier: "prime", heroView: "sidePassenger" },
  { id: "passenger-rear-door", number: 6, name: "Passenger rear door", tagline: "Kerb side, second row", description: "The rear door on the passenger side. Same exposure, friendlier price.", priceCents: 950_000, size: "90 × 75 cm", tier: "prime", heroView: "sidePassenger" },
  { id: "tailgate", number: 7, name: "Rear door", tagline: "Around the spare", description: "The side-hinged rear door, the flat steel either side of the spare wheel.", priceCents: 900_000, size: "2 × 40 × 90 cm", tier: "standard", heroView: "rear" },
  { id: "roof", number: 8, name: "Roof", tagline: "Visible from above", description: "A flat roof the size of a double bed. Seen from every building it parks under.", priceCents: 900_000, size: "200 × 140 cm", tier: "standard", heroView: "top" },
  { id: "driver-quarter", number: 9, name: "Driver rear quarter", tagline: "Behind the rear door", description: "The panel between the rear door and the tail light on the driver side.", priceCents: 700_000, size: "60 × 75 cm", tier: "standard", heroView: "side" },
  { id: "passenger-quarter", number: 10, name: "Passenger rear quarter", tagline: "Mirror of the above", description: "The passenger side counterpart, kerb side exposure.", priceCents: 700_000, size: "60 × 75 cm", tier: "standard", heroView: "sidePassenger" },
  { id: "driver-fender", number: 11, name: "Driver front fender", tagline: "Over the front wheel", description: "The front wing between the headlight and the driver door, with the indicator on top.", priceCents: 650_000, size: "70 × 45 cm", tier: "standard", heroView: "front34" },
  { id: "passenger-fender", number: 12, name: "Passenger front fender", tagline: "Over the other one", description: "The passenger side front wing. Same brief, kerb side.", priceCents: 650_000, size: "70 × 45 cm", tier: "standard", heroView: "sidePassenger" },
  { id: "windshield", number: 13, name: "Windshield banner", tagline: "Always in frame", description: "A strip across the top of the flat, upright windshield.", priceCents: 600_000, size: "130 × 15 cm", tier: "standard", heroView: "front" },
  { id: "rear-window", number: 14, name: "Rear window", tagline: "Behind the glass", description: "A perforated one-way print across the rear door glass, above the spare.", priceCents: 550_000, size: "110 × 40 cm", tier: "bargain", heroView: "rear" },
  { id: "front-bumper", number: 15, name: "Front bumper", tagline: "Low and forward", description: "The lower front fascia between the fog lights.", priceCents: 500_000, size: "120 × 20 cm", tier: "bargain", heroView: "front" },
  { id: "rear-bumper", number: 16, name: "Rear bumper", tagline: "The chasing view", description: "The rear bumper below the spare. Read by everyone stuck behind me.", priceCents: 500_000, size: "120 × 20 cm", tier: "bargain", heroView: "rear" },
  { id: "mirrors", number: 17, name: "Mirror caps", tagline: "A matched pair", description: "Both mirror housings, wrapped as a pair.", priceCents: 350_000, size: "2 × 22 × 14 cm", tier: "bargain", heroView: "front34" },
  { id: "plate", number: 18, name: "Licence plate frame", tagline: "Your text, road rules permitting", description: "A custom frame around the rear plate with a line of your choosing.", priceCents: 390_000, size: "30 × 15 cm", tier: "bargain", heroView: "rear" },
];

export const gwagon: Car = {
  id: "gwagon",
  slug: "g-wagon",
  make: "Mercedes-Benz",
  name: "Mercedes-Benz G 550",
  shortName: "G-Wagon",
  headline: "Your brand on my G-Wagon.",
  blurb:
    "panels on a G-Class that does the school run, the airport and the mountains. Pick one, drop your logo on it, pay once, and it rides for as long as the car does.",
  /** Mercedes-Benz USA MSRP for the 2026 G 550, before the $1,150 destination charge. */
  priceCents: 15_390_000,
  priceSource: "Mercedes-Benz USA's MSRP for a 2026 G 550",
  views: viewsFor("gwagon"),
  spots: SPOTS,
  hotspots: GWAGON_HOTSPOTS as HotspotMap,
  house: {},
};
