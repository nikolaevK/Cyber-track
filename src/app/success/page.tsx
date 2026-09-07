import Link from "next/link";
import { getStore, type SpotState } from "@/lib/store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { carPath, parseStoreKey } from "@/lib/cars";
import { usd } from "@/lib/format";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SpotThumb } from "@/components/SpotThumb";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Success({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  // Only ask Stripe about ids that look like Checkout Session ids; anything else is not worth an API call.
  const sessionId =
    typeof sp.session_id === "string" && /^cs_(live|test)_[A-Za-z0-9]{20,200}$/.test(sp.session_id)
      ? sp.session_id
      : null;
  const holdParam = typeof sp.hold === "string" ? sp.hold : null;
  const store = getStore();

  let state: SpotState | null = null;
  let paid = false;
  let demo = false;

  if (sessionId && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const holdId = session.metadata?.holdId;
      if (holdId) {
        // The webhook normally does this; confirming here too covers local dev without webhooks.
        state = session.payment_status === "paid" ? await store.complete(holdId) : await store.findByHold(holdId);
        paid = session.payment_status === "paid";
      }
    } catch {
      state = null;
    }
  } else if (holdParam) {
    state = await store.findByHold(holdParam);
    paid = state?.status === "sold";
    demo = !stripeConfigured();
  }

  const parsed = state ? parseStoreKey(state.spotId) : null;
  const car = parsed?.car ?? null;
  const spot = parsed ? car!.spots.find((s) => s.id === parsed.spotId) ?? null : null;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-xl text-center">
          {paid && spot && state && car ? (
            <>
              <div className="eyebrow">{demo ? "Demo checkout · Stripe not configured" : "Payment received"}</div>
              <h1 className="display mt-4 text-5xl sm:text-6xl">It&apos;s yours.</h1>
              <p className="mt-5 text-base leading-relaxed text-mute">
                <strong className="text-ink">{state.sponsorName}</strong> now holds the{" "}
                <strong className="text-ink">{spot.name.toLowerCase()}</strong> on the {car.shortName} for the life of
                the car. You will
                get an email to confirm artwork before it is produced, and photos once it is on the car.
              </p>
              <div className="mx-auto mt-8 flex max-w-sm items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left shadow-card">
                <SpotThumb car={car} spot={spot} className="w-28 shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-faint">{String(spot.number).padStart(2, "0")}</div>
                  <div className="font-bold tracking-tight">{spot.name}</div>
                  <div className="text-sm text-mute">
                    {spot.size} · {usd(spot.priceCents)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow">Not confirmed</div>
              <h1 className="display mt-4 text-5xl sm:text-6xl">Nothing was charged.</h1>
              <p className="mt-5 text-base leading-relaxed text-mute">
                We could not find a completed payment for this session. If you did pay, the confirmation can
                take a minute to arrive. Refresh, or head back to the car.
              </p>
            </>
          )}
          <Link
            href={car ? carPath(car) : "/"}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            Back to the {car?.shortName ?? "garage"} →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
