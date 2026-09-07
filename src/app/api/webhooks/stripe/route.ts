import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { getStore, SPOTS_TAG } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 503 });

  const signature = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.warn("[webhook] bad signature", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const store = getStore();
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object;
      if (s.payment_status === "paid" && s.metadata?.holdId) await store.complete(s.metadata.holdId);
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const s = event.data.object;
      if (s.metadata?.holdId) await store.release(s.metadata.holdId);
      break;
    }
  }

  revalidateTag(SPOTS_TAG, { expire: 0 });
  return Response.json({ received: true });
}
