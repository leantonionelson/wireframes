"use client";
import { useEffect, useState } from "react";

/** SSR-safe media query hook; false until mounted, then live. */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatch(m.matches);
    const on = (e: MediaQueryListEvent) => setMatch(e.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}
