"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ORBIT, TERM_LABEL } from "@/lib/spots";
import { spotOf, viewOf } from "@/lib/cars";
import { VB, centroid, fitQuad, viewsShowing } from "@/lib/geometry";
import { matrix3dFor, type Pt } from "@/lib/homography";
import { usd, hostOf } from "@/lib/format";
import { useSpots, type LogoAsset } from "./spot-context";
import { loadLogoFile, textLogo, useIsClient } from "./logo-tools";

const DRAG_STEP = 110;

export function Configurator({ debug = false }: { debug?: boolean }) {
  const { car, states, selectedId, view, logo, brandName, blend, select, setView, setLogo, setBrandName, setBlend, openCheckout } =
    useSpots();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [scale, setScale] = useState(0.72);
  const isClient = useIsClient();
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; index: number; moved: boolean } | null>(null);
  /* Set while a drag just ended so the click that follows it does not select a panel. */
  const skipClick = useRef(false);

  /* Keep the logo overlay in sync with the rendered width of the stage. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / VB.w));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Wordmark fallback when no file is uploaded (canvas-rendered, client only). */
  const textAsset = useMemo<LogoAsset | null>(
    () =>
      logo?.kind === "image" || !isClient
        ? null
        : textLogo(brandName, blend === "print" ? "#0b0b0b" : "#ffffff"),
    [brandName, blend, logo, isClient],
  );

  const activeLogo = logo?.kind === "image" ? logo : textAsset;
  const selected = selectedId ? spotOf(car, selectedId) : null;
  const state = selectedId ? states[selectedId] : null;
  const hotspots = useMemo(() => car.hotspots[view] ?? {}, [car, view]);
  const selectedHotspot = selectedId ? hotspots[selectedId] : undefined;

  const rotate = useCallback(
    (dir: 1 | -1) => {
      const i = ORBIT.indexOf(view);
      const next = i === -1 ? ORBIT[1] : ORBIT[(i + dir + ORBIT.length) % ORBIT.length];
      setView(next);
      setTouched(true);
    },
    [view, setView],
  );

  /* Drag to rotate (no pointer capture so polygon clicks still land). */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, index: Math.max(0, ORBIT.indexOf(view)), moved: false };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const delta = ev.clientX - d.x;
      if (Math.abs(delta) > 8) d.moved = true;
      const step = Math.round(delta / DRAG_STEP);
      const next = ORBIT[(d.index - step + ORBIT.length * 10) % ORBIT.length];
      if (next !== view) setView(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const moved = drag.current?.moved;
      drag.current = null;
      if (moved) setTouched(true);
      // Let the click that follows pointerup see "moved" before it is cleared.
      if (moved) setTimeout(() => (skipClick.current = false), 0);
      skipClick.current = Boolean(moved);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") rotate(1);
    if (e.key === "ArrowLeft") rotate(-1);
    if (e.key === "Escape") select(null);
  };

  const pick = (id: string) => {
    if (skipClick.current) return;
    setTouched(true);
    select(id === selectedId ? null : id);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setLogo(await loadLogoFile(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not load that file.");
    }
  };

  /* Perspective-mapped logo on the selected panel. */
  const overlay = useMemo(() => {
    if (!selectedHotspot || !activeLogo || state?.status === "sold") return null;
    const q = fitQuad(selectedHotspot.quad, activeLogo.w / activeLogo.h);
    return { transform: matrix3dFor(activeLogo.w, activeLogo.h, q), w: activeLogo.w, h: activeLogo.h };
  }, [selectedHotspot, activeLogo, state?.status]);

  /* Sponsor logos already on the truck, always shown. */
  const sponsorOverlays = useMemo(
    () =>
      Object.entries(hotspots).flatMap(([id, hs]) => {
        const s = states[id];
        if (s?.status !== "sold") return [];
        return [
          {
            id,
            src: s.decal ?? s.logoSrc,
            name: s.sponsorName ?? "",
            quad: hs.quad,
            clip: hs.poly,
            mode: s.decal ? ("decal" as const) : ("print" as const),
          },
        ];
      }),
    [hotspots, states],
  );

  const visibleInView = car.spots.filter((s) => hotspots[s.id]);
  const hovered = hoverId ? spotOf(car, hoverId) : null;
  const hoverPt = hoverId && hotspots[hoverId] ? centroid(hotspots[hoverId].poly) : null;

  return (
    <section id="configure" className="scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        {/* Stage */}
        <div>
          <div
            ref={stageRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            className="relative aspect-[1000/558] w-full select-none overflow-hidden rounded-3xl bg-[#f6f6f4] outline-none ring-offset-4 focus-visible:ring-2 focus-visible:ring-ink/60 touch-pan-y cursor-grab active:cursor-grabbing"
            aria-label={`Interactive ${car.shortName}. Use left and right arrow keys to rotate.`}
          >
            {car.views.map((v) => (
              <Image
                key={v.id}
                src={v.src}
                alt={v.id === view ? `${car.name}, ${v.label.toLowerCase()} view` : ""}
                fill
                priority={v.id === view}
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                draggable={false}
                className="object-cover transition-opacity duration-300 ease-out"
                style={{ opacity: v.id === view ? 1 : 0 }}
              />
            ))}

            {/* Sponsor logos + live preview, in a 1000-unit space scaled to the stage. */}
            <div
              className="pointer-events-none absolute left-0 top-0"
              style={{ width: VB.w, height: VB.h, transform: `scale(${scale})`, transformOrigin: "0 0" }}
            >
              {sponsorOverlays.map((o) => (
                <SponsorLogo key={o.id} src={o.src} name={o.name} quad={o.quad} clip={o.clip} mode={o.mode} />
              ))}
              {overlay && selectedHotspot && (
                <PanelClip poly={selectedHotspot.poly}>
                  <motion.img
                    key={`${selectedId}-${view}-${activeLogo?.src.length}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={activeLogo!.src}
                    alt=""
                    className="absolute left-0 top-0 max-w-none"
                    style={{
                      width: overlay.w,
                      height: overlay.h,
                      transform: overlay.transform,
                      transformOrigin: "0 0",
                      mixBlendMode: blend === "print" ? "multiply" : "normal",
                      opacity: blend === "print" ? 0.9 : 1,
                      filter: blend === "decal" ? "drop-shadow(0 2px 3px rgba(0,0,0,.35))" : undefined,
                    }}
                  />
                </PanelClip>
              )}
            </div>

            <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full">
              {debug && (
                <g className="pointer-events-none" fontSize="9" fontFamily="monospace" fill="red">
                  {Array.from({ length: 21 }, (_, i) => i * 50).map((x) => (
                    <g key={`x${x}`}>
                      <line x1={x} y1={0} x2={x} y2={VB.h} stroke="rgba(255,0,0,.4)" strokeWidth={x % 100 === 0 ? 0.8 : 0.3} />
                      {x % 100 === 0 && <text x={x + 2} y={9}>{x}</text>}
                    </g>
                  ))}
                  {Array.from({ length: 12 }, (_, i) => i * 50).map((y) => (
                    <g key={`y${y}`}>
                      <line x1={0} y1={y} x2={VB.w} y2={y} stroke="rgba(255,0,0,.4)" strokeWidth={y % 100 === 0 ? 0.8 : 0.3} />
                      {y % 100 === 0 && <text x={2} y={y - 2}>{y}</text>}
                    </g>
                  ))}
                </g>
              )}
              {Object.entries(hotspots).map(([id, hs]) => {
                const st = states[id]?.status ?? "available";
                const spot = spotOf(car, id)!;
                const polys = [hs.poly, ...(hs.extra ?? [])];
                return (
                  <g key={id}>
                    {polys.map((poly, i) => (
                      <polygon
                        key={i}
                        points={poly.map((p) => p.join(",")).join(" ")}
                        className={`hotspot ${!touched && !selectedId ? "pulse" : ""} ${debug ? "!stroke-red-500 !fill-red-500/20" : ""}`}
                        data-state={st}
                        data-selected={id === selectedId}
                        role="button"
                        tabIndex={i === 0 ? 0 : -1}
                        aria-label={i === 0 ? `${spot.name}, ${st === "sold" ? "sold" : usd(spot.priceCents)}` : undefined}
                        aria-hidden={i > 0 || undefined}
                        onClick={() => pick(id)}
                        onKeyDown={(e) => e.key === "Enter" && pick(id)}
                        onPointerEnter={() => setHoverId(id)}
                        onPointerLeave={() => setHoverId(null)}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* Hover label */}
            <AnimatePresence>
              {hovered && hoverPt && hoverId !== selectedId && (
                <motion.div
                  key={hoverId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-card"
                  style={{ left: `${(hoverPt[0] / VB.w) * 100}%`, top: `${(hoverPt[1] / VB.h) * 100}%` }}
                >
                  {hovered.name}
                  <span className="ml-2 font-mono text-[11px] font-medium text-white/70">
                    {states[hovered.id]?.status === "sold"
                      ? `Sold · ${states[hovered.id].sponsorName}`
                      : states[hovered.id]?.status === "pending"
                        ? "Reserved"
                        : usd(hovered.priceCents)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rotate arrows */}
            <button
              type="button"
              aria-label="Rotate left"
              onClick={() => rotate(-1)}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition hover:bg-white sm:flex"
            >
              <Arrow dir="left" />
            </button>
            <button
              type="button"
              aria-label="Rotate right"
              onClick={() => rotate(1)}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition hover:bg-white sm:flex"
            >
              <Arrow dir="right" />
            </button>

            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-mute backdrop-blur sm:bottom-3 sm:text-[10px] sm:tracking-[0.16em]">
              Drag to rotate · Click a panel
            </div>
          </div>

          {/* View switcher */}
          <div className="mt-4 flex flex-wrap items-center gap-1 rounded-full border border-line bg-white p-1">
            {car.views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setView(v.id);
                  setTouched(true);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  v.id === view ? "bg-ink text-white" : "text-mute hover:bg-mist hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {/* Keyed enter-only animation: an interrupted exit can never leave the card invisible. */}
          <div>
            {selected && state ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-line bg-white p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow">
                      Spot {String(selected.number).padStart(2, "0")} · {selected.tier}
                    </div>
                    <h3 className="display mt-2 text-3xl">{selected.name}</h3>
                    <p className="mt-1 text-sm text-mute">{selected.tagline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => select(null)}
                    aria-label="Deselect"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-mute transition hover:bg-line hover:text-ink"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-mute">{selected.description}</p>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-5 text-sm">
                  <div>
                    <dt className="eyebrow">Price</dt>
                    <dd className="tabular mt-1 text-2xl font-bold tracking-tight">{usd(selected.priceCents)}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Status</dt>
                    <dd className="mt-1">
                      <StatusPill status={state.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Size</dt>
                    <dd className="mt-1 font-medium">{selected.size}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Term</dt>
                    <dd className="mt-1 font-medium">{TERM_LABEL}</dd>
                  </div>
                </dl>

                {state.status === "sold" && state.renders?.length ? (
                  <div className="mt-5">
                    <div className="eyebrow">On the truck</div>
                    <a
                      href={state.renders[0].src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block overflow-hidden rounded-2xl border border-line bg-mist"
                      title="Open full size"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={state.renders[0].src} alt={state.renders[0].alt} className="aspect-[16/9] w-full object-cover" />
                    </a>
                    {state.renders.length > 1 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {state.renders.slice(1).map((r) => (
                          <a key={r.src} href={r.src} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border border-line bg-mist" title="Open full size">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.src} alt={r.alt} className="aspect-[16/9] w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {state.status === "sold" ? (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-mist p-3">
                    <Avatar src={state.logoSrc} name={state.sponsorName ?? ""} />
                    <div className="min-w-0">
                      <div className="eyebrow">Held by</div>
                      <div className="truncate text-sm font-semibold">{state.sponsorName}</div>
                      {state.sponsorUrl && (
                        <a
                          href={state.sponsorUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="truncate text-xs text-mute underline-offset-2 hover:underline"
                        >
                          {hostOf(state.sponsorUrl)}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 border-t border-line pt-5">
                    <div className="flex items-center justify-between">
                      <div className="eyebrow">Preview your logo on it</div>
                      {(logo || brandName) && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogo(null);
                            setBrandName("");
                          }}
                          className="text-xs text-mute hover:text-ink"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-mist/60 px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-ink/40 hover:bg-mist">
                        <UploadIcon />
                        {logo?.kind === "image" ? "Replace logo" : "Upload logo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => onFile(e.target.files?.[0])}
                        />
                      </label>
                      <div className="flex rounded-xl border border-line p-0.5 text-xs font-semibold">
                        {(["print", "decal"] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBlend(b)}
                            className={`rounded-[10px] px-3 transition ${blend === b ? "bg-ink text-white" : "text-mute hover:text-ink"}`}
                            title={b === "print" ? "Ink on steel" : "Vinyl decal"}
                          >
                            {b === "print" ? "Print" : "Decal"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        if (logo?.kind === "image") setLogo(null);
                      }}
                      placeholder="…or type your brand name"
                      maxLength={40}
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-ink/50"
                    />
                  </div>
                )}

                <div className="mt-5">
                  {state.status === "available" ? (
                    <button
                      type="button"
                      onClick={() => openCheckout(selected.id)}
                      className="group flex w-full items-center justify-between rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      <span>Buy this spot</span>
                      <span className="tabular flex items-center gap-2 text-white/80">
                        {usd(selected.priceCents)}
                        <span className="transition group-hover:translate-x-0.5">→</span>
                      </span>
                    </button>
                  ) : state.status === "pending" ? (
                    <div className="rounded-full border border-warn/40 bg-warn/5 px-5 py-3.5 text-center text-sm font-semibold text-warn">
                      Reserved · someone is checking out
                    </div>
                  ) : (
                    <div className="rounded-full bg-mist px-5 py-3.5 text-center text-sm font-semibold text-mute">
                      Sold
                    </div>
                  )}
                  {view !== selected.heroView && (
                    <button
                      type="button"
                      onClick={() => setView(selected.heroView)}
                      className="mt-3 w-full text-center text-xs font-medium text-mute underline-offset-2 hover:text-ink hover:underline"
                    >
                      Show the best angle for this panel →
                    </button>
                  )}
                  {viewsShowing(car.hotspots, selected.id).length > 1 && view === selected.heroView && (
                    <p className="mt-3 text-center text-xs text-faint">
                      Also visible from{" "}
                      {viewsShowing(car.hotspots, selected.id)
                        .filter((v) => v !== selected.heroView)
                        .map((v) => viewOf(car, v).label.toLowerCase())
                        .join(", ")}
                      .
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-line bg-white p-6 shadow-card"
              >
                <div className="eyebrow">Pick a panel</div>
                <h3 className="display mt-2 text-3xl">{car.spots.length} spots. One {car.shortName}.</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Click any panel on the car to see its price, drop your logo on it, and buy it. Rotate to find
                  the rest.
                </p>
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {visibleInView.map((s) => {
                    const st = states[s.id]?.status ?? "available";
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => pick(s.id)}
                          onPointerEnter={() => setHoverId(s.id)}
                          onPointerLeave={() => setHoverId(null)}
                          className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-mist/60"
                        >
                          <span className="w-6 font-mono text-[11px] text-faint">
                            {String(s.number).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-sm font-semibold">{s.name}</span>
                          <span className="tabular text-sm text-mute">
                            {st === "sold" ? "Sold" : st === "pending" ? "Reserved" : usd(s.priceCents)}
                          </span>
                          <Dot status={st} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  {visibleInView.length} of {car.spots.length} panels in this view
                </p>
              </motion.div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

/** Clips anything inside to the panel's traced outline, so overlays follow the real panel shape. */
function PanelClip({ poly, children }: { poly: Pt[]; children: React.ReactNode }) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width: VB.w,
        height: VB.h,
        clipPath: `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(", ")})`,
      }}
    >
      {children}
    </div>
  );
}

/** A sold panel: the sponsor's logo or white decal, or their name as a wordmark when no logo was supplied. */
function SponsorLogo({
  src,
  name,
  quad,
  clip,
  mode = "print",
}: {
  src: string | null;
  name: string;
  quad: Parameters<typeof fitQuad>[0];
  clip: Pt[];
  /** print: dark ink multiplied onto the steel. decal: white cut vinyl, opaque, with a faint edge shadow. */
  mode?: "print" | "decal";
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const isClient = useIsClient();
  const fallback = useMemo(() => (src || !isClient ? null : textLogo(name, "#0b0b0b")), [src, name, isClient]);
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  const asset = src ? (size ? { src, ...size } : null) : fallback;
  if (!asset) return null;
  const q = fitQuad(quad, asset.w / asset.h, mode === "decal" ? 0.16 : 0.12);
  return (
    <PanelClip poly={clip}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt=""
        className="absolute left-0 top-0 max-w-none"
        style={{
          width: asset.w,
          height: asset.h,
          transform: matrix3dFor(asset.w, asset.h, q),
          transformOrigin: "0 0",
          mixBlendMode: mode === "decal" ? "normal" : "multiply",
          opacity: mode === "decal" ? 1 : 0.92,
          filter: mode === "decal" ? "drop-shadow(0 1px 1.5px rgba(0,0,0,.35))" : undefined,
        }}
      />
    </PanelClip>
  );
}

export function StatusPill({ status }: { status: "available" | "pending" | "sold" }) {
  const map = {
    available: "bg-ok/10 text-ok",
    pending: "bg-warn/10 text-warn",
    sold: "bg-ink text-white",
  } as const;
  const label = { available: "Available", pending: "Reserved", sold: "Sold" }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      <Dot status={status} /> {label}
    </span>
  );
}

export function Dot({ status }: { status: "available" | "pending" | "sold" }) {
  const c = { available: "bg-ok", pending: "bg-warn", sold: "bg-ink" }[status];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />;
}

export function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-sm font-bold">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 11V3m0 0L5 6m3-3 3 3M3 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
