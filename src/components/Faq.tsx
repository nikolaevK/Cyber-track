import type { Car } from "@/lib/cars";
import { usd } from "@/lib/format";

const qa = (car: Car): [string, string][] => [
  [
    "Is this real?",
    "Yes. Three cars, one owner, real vinyl. Sold panels are wrapped at the next wrap date and I post photos and a monthly route log so you can see your logo out in the world.",
  ],
  [
    "What exactly do I get?",
    "Your panel for the life of the car, applied at the next wrap date. A photo set of the finished wrap for your own channels. A permanent listing on this page with a link to your site.",
  ],
  [
    `Why do the prices add up to ${usd(car.priceCents)}?`,
    `Because that is ${car.priceSource}. ${car.spots.length} panels, one ${car.shortName}, sold at cost. Buy them all and you have bought the car's exterior outright.`,
  ],
  [
    "How long is the life of the car?",
    "Until it is sold, written off, or retired from the road. I intend to keep all three for a long time. If one leaves the road within the first three years, unused time is refunded pro rata.",
  ],
  [
    "What can I put on it?",
    "Your logo or wordmark, produced as cut vinyl or a printed wrap sized to the panel. Nothing political, adult or defamatory, and nothing I would be uncomfortable explaining to my neighbours. I will confirm the artwork with you before it is produced.",
  ],
  [
    "When does it go on the truck?",
    "Panels are applied in batches on the wrap date shown at the top of the page. If you buy after that, yours is applied within two weeks.",
  ],
  [
    "Can I change the artwork later?",
    "Once a year at no charge, for example if you rebrand. Beyond that, a rewrap is at cost.",
  ],
  [
    "What about refunds?",
    "Full refund any time before the wrap is applied. After that the vinyl is on the truck and the money is spent, so no refunds.",
  ],
  [
    "Is this affiliated with Tesla, Mercedes-Benz or Porsche?",
    "No. This is an independent project by a private owner. The car names are trademarks of their manufacturers and are used here only to describe the vehicles.",
  ],
];

export function Faq({ car }: { car: Car }) {
  const QA = qa(car);
  return (
    <section id="faq" className="mx-auto max-w-2xl scroll-mt-24 pt-28 sm:pt-36">
      <div className="eyebrow">Questions</div>
      <h2 className="display mt-3 text-5xl sm:text-6xl">FAQ.</h2>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {QA.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-mute transition group-open:rotate-45 group-open:border-ink group-open:text-ink"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="block">
                  <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="pb-6 pr-12 text-sm leading-relaxed text-mute">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
