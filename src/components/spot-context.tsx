"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { View } from "@/lib/spots";
import { spotOf, type Car } from "@/lib/cars";
import type { PublicSpotState } from "@/lib/public";

export interface LogoAsset {
  src: string;
  w: number;
  h: number;
  kind: "image" | "text";
}

export type Blend = "print" | "decal";

interface SpotContextValue {
  car: Car;
  states: Record<string, PublicSpotState>;
  selectedId: string | null;
  view: View;
  logo: LogoAsset | null;
  brandName: string;
  blend: Blend;
  checkoutId: string | null;
  select: (id: string | null, opts?: { scroll?: boolean }) => void;
  setView: (v: View) => void;
  setLogo: (l: LogoAsset | null) => void;
  setBrandName: (s: string) => void;
  setBlend: (b: Blend) => void;
  openCheckout: (id: string) => void;
  closeCheckout: () => void;
}

const SpotContext = createContext<SpotContextValue | null>(null);

export function SpotProvider({
  car,
  states,
  initialView,
  children,
}: {
  car: Car;
  states: Record<string, PublicSpotState>;
  initialView: View;
  children: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>(initialView);
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [brandName, setBrandName] = useState("");
  const [blend, setBlend] = useState<Blend>("print");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const select = useCallback((id: string | null, opts?: { scroll?: boolean }) => {
    setSelectedId(id);
    if (id) {
      const spot = spotOf(car, id);
      // Stay on the current angle if the panel is visible there; otherwise jump to its best angle.
      if (spot) setView((v) => (car.hotspots[v]?.[id] ? v : spot.heroView));
      if (opts?.scroll) {
        document.getElementById("configure")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [car]);

  const value = useMemo<SpotContextValue>(
    () => ({
      car,
      states,
      selectedId,
      view,
      logo,
      brandName,
      blend,
      checkoutId,
      select,
      setView,
      setLogo,
      setBrandName,
      setBlend,
      openCheckout: (id) => setCheckoutId(id),
      closeCheckout: () => setCheckoutId(null),
    }),
    [car, states, selectedId, view, logo, brandName, blend, checkoutId, select],
  );

  return <SpotContext.Provider value={value}>{children}</SpotContext.Provider>;
}

export function useSpots() {
  const ctx = useContext(SpotContext);
  if (!ctx) throw new Error("useSpots must be used inside <SpotProvider>");
  return ctx;
}
