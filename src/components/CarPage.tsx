import type { Car } from "@/lib/cars";
import { listSpotStates } from "@/lib/store";
import { toPublicStates } from "@/lib/public";
import { SpotProvider } from "@/components/spot-context";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Configurator } from "@/components/Configurator";
import { SpotList } from "@/components/SpotList";
import { SponsorWall } from "@/components/SponsorWall";
import { HowItWorks } from "@/components/HowItWorks";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { CheckoutDialog } from "@/components/CheckoutDialog";

/** The whole site for one car. Every section reads the car's own catalog, renders and hotspots. */
export async function CarPage({ car, debug = false }: { car: Car; debug?: boolean }) {
  const states = toPublicStates(car, await listSpotStates());

  return (
    <SpotProvider key={car.id} car={car} states={states} initialView="front34">
      <Nav />
      <main className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        <Hero car={car} states={states} />
        <Configurator debug={debug} />
        <SpotList />
        <SponsorWall car={car} states={states} />
        <HowItWorks car={car} />
        <Faq car={car} />
      </main>
      <Footer />
      <CheckoutDialog />
    </SpotProvider>
  );
}
