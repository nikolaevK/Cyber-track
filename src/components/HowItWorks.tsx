import { viewOf, type Car } from "@/lib/cars";

export function HowItWorks({ car }: { car: Car }) {
  const steps = [
    {
      n: "01",
      title: "Pick a panel",
      body: `${car.spots.length} fixed-price spots. Rotate the ${car.shortName}, click a panel, and drop your logo on it to see how it reads before you pay.`,
      img: viewOf(car, "front34").src,
      pos: "62% 55%",
      zoom: "170%",
    },
    {
      n: "02",
      title: "Pay once",
      body: "Checkout runs through Stripe. The moment payment clears, the spot is yours and your brand shows up on this page.",
      img: viewOf(car, "rear").src,
      pos: "50% 50%",
      zoom: "160%",
    },
    {
      n: "03",
      title: "It goes on the car",
      body: "Artwork is produced in cut vinyl or printed wrap and applied at the next wrap date. You get the photos, and the panel stays yours for the life of the car.",
      img: viewOf(car, "side").src,
      pos: "45% 52%",
      zoom: "180%",
    },
  ];
  return (
    <section id="how" className="scroll-mt-24 pt-28 text-center sm:pt-36">
      <div className="eyebrow">How it works</div>
      <h2 className="display mt-3 text-5xl sm:text-6xl">Three steps.</h2>
      <ol className="mt-12 grid gap-4 text-left sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <div
              aria-hidden
              className="aspect-[4/3] w-full bg-mist"
              style={{
                backgroundImage: `url(${s.img})`,
                backgroundSize: s.zoom,
                backgroundPosition: s.pos,
                backgroundRepeat: "no-repeat",
              }}
            />
            <div className="p-5">
              <div className="font-mono text-[11px] text-faint">{s.n}</div>
              <h3 className="mt-1 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
