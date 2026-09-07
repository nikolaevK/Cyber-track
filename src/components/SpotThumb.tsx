import { viewOf, type Car } from "@/lib/cars";
import { VB } from "@/lib/geometry";
import type { Spot } from "@/lib/spots";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Crops the spot's best-angle render around its hotspot, sized so the panel fills ~70% of the box. */
export function SpotThumb({
  car,
  spot,
  className = "",
  aspect = 4 / 3,
}: {
  car: Car;
  spot: Spot;
  className?: string;
  aspect?: number;
}) {
  const view = viewOf(car, spot.heroView);
  const hs = car.hotspots[spot.heroView]?.[spot.id];
  const imgAspect = VB.w / VB.h;
  let zoom = imgAspect / aspect + 0.05;
  let cx = 0.5;
  let cy = 0.5;
  if (hs) {
    const xs = hs.poly.map((p) => p[0]);
    const ys = hs.poly.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    cx = (minX + maxX) / 2 / VB.w;
    cy = (minY + maxY) / 2 / VB.h;
    const w = (maxX - minX) / VB.w;
    const h = (maxY - minY) / VB.w;
    zoom = clamp(Math.min(0.7 / w, 0.7 / (h * aspect)), imgAspect / aspect + 0.05, 3.2);
  }
  const imgH = zoom / imgAspect;
  const boxH = 1 / aspect;
  const px = (0.5 - cx * zoom) / (1 - zoom);
  const py = (boxH / 2 - cy * imgH) / (boxH - imgH);

  return (
    <div
      aria-hidden
      className={`overflow-hidden rounded-xl bg-mist ${className}`}
      style={{
        aspectRatio: `${aspect}`,
        backgroundImage: `url(${view.src})`,
        backgroundSize: `${zoom * 100}%`,
        backgroundPosition: `${px * 100}% ${py * 100}%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
