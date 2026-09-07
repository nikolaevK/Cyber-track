"use client";

import { usd, hostOf } from "@/lib/format";
import { useSpots } from "./spot-context";
import { SpotThumb } from "./SpotThumb";
import { Avatar, Dot } from "./Configurator";

export function SpotList() {
  const { car, states, select, openCheckout, selectedId } = useSpots();

  return (
    <section id="spots" className="scroll-mt-24 pt-28 sm:pt-36">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="eyebrow">Rate card</div>
          <h2 className="display mt-3 text-5xl sm:text-6xl">The spots.</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-mute md:text-right">
          Every panel is a fixed price and the {car.spots.length} together cost exactly what the{" "}
          {car.shortName} did. Buy one and it is yours for the life of the car. No bidding, no auction.
        </p>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {car.spots.map((spot) => {
          const s = states[spot.id];
          const status = s?.status ?? "available";
          const active = selectedId === spot.id;
          return (
            <li
              key={spot.id}
              className={`grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-3 py-4 transition sm:grid-cols-[128px_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] sm:gap-x-6 sm:py-5 ${
                active ? "bg-mist/60" : ""
              }`}
            >
              <button type="button" onClick={() => select(spot.id, { scroll: true })} className="text-left" aria-label={`Show ${spot.name} on the car`}>
                <SpotThumb car={car} spot={spot} className="w-[72px] sm:w-32" />
              </button>

              <button type="button" onClick={() => select(spot.id, { scroll: true })} className="min-w-0 text-left">
                <div className="font-mono text-[11px] text-faint">{String(spot.number).padStart(2, "0")}</div>
                <div className="mt-0.5 text-lg font-bold tracking-tight">{spot.name}</div>
                <div className="text-sm text-mute">{spot.tagline}</div>
              </button>

              <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                <Avatar src={s?.logoSrc ?? null} name={s?.sponsorName ?? "–"} size={40} />
                <div className="min-w-0">
                  <div className="eyebrow">{status === "sold" ? "Held by" : status === "pending" ? "Reserved" : "Held by"}</div>
                  <div className="truncate text-sm font-semibold">
                    {status === "sold" ? s?.sponsorName : status === "pending" ? "Checkout in progress" : "No one yet"}
                  </div>
                  {status === "sold" && s?.sponsorUrl && (
                    <a
                      href={s.sponsorUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="block truncate text-xs text-mute hover:underline"
                    >
                      {hostOf(s.sponsorUrl)}
                    </a>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="eyebrow">Price</div>
                <div className="tabular mt-0.5 text-lg font-bold tracking-tight">{usd(spot.priceCents)}</div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-faint sm:justify-end">
                  <Dot status={status} /> {spot.size}
                </div>
              </div>

              <div className="text-right">
                {status === "available" ? (
                  <button
                    type="button"
                    onClick={() => {
                      select(spot.id);
                      openCheckout(spot.id);
                    }}
                    className="group inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2.5 text-xs font-semibold transition hover:bg-ink hover:text-white"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">Buy</span>
                    <span className="tabular">{usd(spot.priceCents)}</span>
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </button>
                ) : (
                  <span className="inline-flex rounded-full bg-mist px-4 py-2.5 text-xs font-semibold text-mute">
                    {status === "sold" ? "Sold" : "Reserved"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
