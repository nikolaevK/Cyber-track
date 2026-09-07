import type { Metadata } from "next";
import { DEFAULT_CAR } from "@/lib/cars";
import { CarPage } from "@/components/CarPage";

// Spot state changes with every purchase, so always render fresh.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: DEFAULT_CAR.headline };

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  return <CarPage car={DEFAULT_CAR} debug={sp.debug === "1"} />;
}
