"use client";
import React, { useLayoutEffect, useState } from "react";

/* ---------- floating toolbar anchored to a canvas element ---------- */
export function FloatingToolbar({ targetId, deps, children }: { targetId: string; deps: unknown[]; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) { setPos(null); return; }
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, ...deps]);
  if (!pos) return null;
  return (
    <div className="toolbar fixed z-30 flex items-center gap-0.5 px-1.5 py-1 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-xl"
         style={{ left: pos.x, top: Math.max(70, pos.y - 8), transform: "translate(-50%,-100%)" }}>
      {children}
    </div>
  );
}
