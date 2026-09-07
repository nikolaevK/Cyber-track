"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now === null) return <span className="tabular">--d --h --m --s</span>;
  const p = parts(Date.parse(to) - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="tabular">
      {pad(p.d)}d {pad(p.h)}h {pad(p.m)}m {pad(p.s)}s
    </span>
  );
}
