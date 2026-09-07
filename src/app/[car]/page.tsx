import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { carBySlug, CARS } from "@/lib/cars";
import { CarPage } from "@/components/CarPage";

export const dynamic = "force-dynamic";

type Params = Promise<{ car: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const car = carBySlug((await params).car);
  return { title: car?.headline ?? "Not found" };
}

export function generateStaticParams() {
  return CARS.map((c) => ({ car: c.slug }));
}

export default async function CarRoute({ params, searchParams }: { params: Params; searchParams: Search }) {
  const car = carBySlug((await params).car);
  if (!car) notFound();
  const sp = await searchParams;
  return <CarPage car={car} debug={sp.debug === "1"} />;
}
