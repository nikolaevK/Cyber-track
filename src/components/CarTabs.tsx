import Link from "next/link";
import { CARS, carPath, viewOf, type Car } from "@/lib/cars";
import { usd } from "@/lib/format";

/** Switches the whole page between cars. Each car is its own route so the tab is shareable. */
export function CarTabs({ current }: { current: Car }) {
  return (
    <nav aria-label="Choose a car" className="fade-up mx-auto flex max-w-2xl flex-wrap justify-center gap-2">
      {CARS.map((car) => {
        const active = car.id === current.id;
        return (
          <Link
            key={car.id}
            href={carPath(car)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-4 text-left transition ${
              active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"
            }`}
          >
            <span
              aria-hidden
              className="block h-9 w-14 shrink-0 overflow-hidden rounded-full bg-mist"
              style={{
                backgroundImage: `url(${viewOf(car, "side").src})`,
                backgroundSize: "150%",
                backgroundPosition: "50% 55%",
              }}
            />
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{car.shortName}</span>
              <span className={`tabular block font-mono text-[10px] ${active ? "text-white/70" : "text-mute"}`}>
                {car.spots.length} spots · {usd(car.priceCents)}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
