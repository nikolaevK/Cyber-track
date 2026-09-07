import { WRAP_DATE } from "@/lib/spots";
import { totalCents, type Car } from "@/lib/cars";
import { usd } from "@/lib/format";
import type { PublicSpotState } from "@/lib/public";
import { Countdown } from "./Countdown";
import { CarTabs } from "./CarTabs";

export function Hero({ car, states }: { car: Car; states: Record<string, PublicSpotState> }) {
  const sold = car.spots.filter((s) => states[s.id]?.status === "sold");
  const soldCents = sold.reduce((sum, s) => sum + s.priceCents, 0);
  const target = totalCents(car);
  const pct = Math.round((soldCents / target) * 100);

  return (
    <section className="pb-12 pt-28 text-center sm:pt-32">
      <CarTabs current={car} />
      <div className="eyebrow fade-up mt-10">A real car · Real roads · Fixed prices</div>
      <h1
        className="display fade-up mx-auto mt-6 max-w-[11ch] text-[clamp(3.4rem,10.5vw,8.75rem)]"
        style={{ animationDelay: "60ms" }}
      >
        {car.headline}
      </h1>
      <p
        className="fade-up mx-auto mt-7 max-w-xl text-base leading-relaxed text-mute sm:text-lg"
        style={{ animationDelay: "120ms" }}
      >
        {car.spots.length} {car.blurb}
      </p>

      <div
        className="fade-up mx-auto mt-10 max-w-2xl rounded-2xl border border-line bg-white p-5 text-left shadow-card"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="tabular text-2xl font-bold tracking-tight">{usd(soldCents)}</div>
          <div className="font-mono text-[11px] text-mute">
            of {usd(target)} · all {car.spots.length} panels add up to the price of the {car.shortName}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${Math.max(pct, 1.5)}%` }} />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-mute">
          <span>
            {pct}% claimed · {sold.length} of {car.spots.length} spots taken
          </span>
          <span>
            Next wrap in <Countdown to={WRAP_DATE} />
          </span>
        </div>
      </div>
    </section>
  );
}
