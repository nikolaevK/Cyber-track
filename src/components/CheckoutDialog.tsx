"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spotOf } from "@/lib/cars";
import { usd } from "@/lib/format";
import { useSpots } from "./spot-context";
import { loadLogoFile } from "./logo-tools";
import { Avatar } from "./Configurator";

export function CheckoutDialog() {
  const { car, checkoutId, closeCheckout, logo, setLogo, brandName, setBrandName } = useSpots();
  const spot = checkoutId ? spotOf(car, checkoutId) : null;
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCheckout();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [checkoutId, closeCheckout]);

  const close = () => {
    setError(null);
    closeCheckout();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          spotId: spot.id,
          sponsorName: brandName,
          sponsorUrl: url,
          email,
          logoDataUrl: logo?.kind === "image" ? logo.src : null,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong. Try again.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {spot && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.form
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-modal sm:p-7"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-mist text-mute transition hover:bg-line hover:text-ink"
            >
              ×
            </button>
            <div className="eyebrow">Claim this spot</div>
            <h2 id="checkout-title" className="display mt-2 text-3xl">
              {spot.name}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {spot.size} · on the {car.shortName} for life · one payment.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
              <span className="eyebrow">Total</span>
              <span className="tabular text-2xl font-bold tracking-tight">{usd(spot.priceCents)}</span>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Company / brand">
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme Inc."
                  className={input}
                />
              </Field>
              <Field label="Website">
                <input
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://acme.com"
                  className={input}
                />
              </Field>
              <Field label="Work email">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@acme.com"
                  autoComplete="email"
                  className={input}
                />
              </Field>
              <Field label="Logo (optional, you can send it later)">
                <div className="flex items-center gap-3">
                  <Avatar src={logo?.kind === "image" ? logo.src : null} name={brandName || "?"} size={44} />
                  <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:bg-mist">
                    {logo?.kind === "image" ? "Replace" : "Choose file"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setLogo(await loadLogoFile(f));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not load that file.");
                        }
                      }}
                    />
                  </label>
                  <span className="text-xs text-faint">PNG, JPEG or WebP. Up to ~1 MB.</span>
                </div>
              </Field>
              <label className="flex items-start gap-3 text-xs leading-relaxed text-mute">
                <input
                  type="checkbox"
                  required
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ink"
                />
                <span>
                  I have the rights to this brand, the artwork is not offensive or political, and I understand
                  the spot is applied at the next wrap date and stays on for the life of the car.
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {busy ? "Opening secure checkout…" : `Pay ${usd(spot.priceCents)} with Stripe →`}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
              Card details are handled by Stripe and never touch this site. Your brand, website and logo are
              shown publicly once paid. Your email stays private.
            </p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const input =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-ink/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
