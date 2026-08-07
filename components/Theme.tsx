"use client";
import { useEffect, useState } from "react";

export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2.6" width="16" height="3.6" rx="1.8" />
      <rect x="2" y="8.2" width="10.5" height="3.6" rx="1.8" opacity="0.75" />
      <rect x="2" y="13.8" width="16" height="3.6" rx="1.8" opacity="0.5" />
    </svg>
  );
}

/** Full-screen loading state: the mark assembles itself bar by bar, which is
 *  the scaffolding metaphor doing the work. Callers hold this for at least
 *  one full cycle so the animation is never cut off mid-build. */
export const SCAFFOLD_CYCLE_MS = 1600;

export function ScaffoldingLoader({ label = "Scaffolding" }: { label?: string }) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-5 bg-[var(--bg)] text-[var(--accent)]">
      <svg width="52" height="52" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect className="scaffold-bar" x="2" y="2.6" width="16" height="3.6" rx="1.8" />
        <rect className="scaffold-bar" x="2" y="8.2" width="10.5" height="3.6" rx="1.8" opacity="0.75" />
        <rect className="scaffold-bar" x="2" y="13.8" width="16" height="3.6" rx="1.8" opacity="0.5" />
      </svg>
      <p className="scaffold-word tk text-[12px] tracking-[0.22em] uppercase text-[var(--muted)]">{label}</p>
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState("");
  useEffect(() => { setTheme(document.documentElement.dataset.theme || "light"); }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("scaffold.theme", next);
    setTheme(next);
  };
  return (
    <button onClick={flip} title="Toggle light / dark"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] hover:bg-[var(--hover)] text-[var(--muted)]">
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      )}
    </button>
  );
}
