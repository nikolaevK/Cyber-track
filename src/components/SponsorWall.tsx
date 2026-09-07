import type { Car } from "@/lib/cars";
import { hostOf } from "@/lib/format";
import type { PublicSpotState } from "@/lib/public";
import { Avatar } from "./Configurator";

export function SponsorWall({ car, states }: { car: Car; states: Record<string, PublicSpotState> }) {
  const sold = car.spots.filter((s) => states[s.id]?.status === "sold");

  return (
    <section id="sponsors" className="scroll-mt-24 pt-28 sm:pt-36">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="eyebrow">Permanent placement</div>
          <h2 className="display mt-3 text-5xl sm:text-6xl">On the {car.shortName}.</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-mute md:text-right">
          Every wrap stays on for the life of the car, and every sponsor stays on this page with a link.
        </p>
      </div>

      {sold.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-dashed border-line bg-mist/50 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white font-mono text-xs text-faint shadow-card">
              01
            </span>
            <p className="text-sm text-mute">The first brand on the {car.shortName} will appear here permanently.</p>
          </div>
          <a href="#configure" className="text-sm font-semibold underline-offset-4 hover:underline">
            Be the first →
          </a>
        </div>
      ) : (
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sold.map((spot) => {
            const s = states[spot.id];
            return (
              <li key={spot.id}>
                <a
                  href={s.sponsorUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5"
                >
                  {s.renders?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.renders[0].src} alt={s.renders[0].alt} className="aspect-[16/9] w-full object-cover" />
                  )}
                  <div className="flex items-center gap-4 p-4">
                    <Avatar src={s.logoDataUrl} name={s.sponsorName ?? ""} size={56} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{s.sponsorName}</div>
                      <div className="truncate text-xs text-mute">{hostOf(s.sponsorUrl)}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                        {String(spot.number).padStart(2, "0")} · {spot.name}
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
