import React from "react";
import type { GlyphId } from "./model";

// Mini wireframe glyphs drawn on a 72x28 canvas, stroke/fill currentColor.
const G = (children: React.ReactNode) => (
  <svg viewBox="0 0 72 28" width="100%" height="28" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" opacity="0.85" aria-hidden="true">
    {children}
  </svg>
);

export const GLYPHS: Record<GlyphId, { name: string; el: React.ReactNode }> = {
  hero:     { name: "Hero",              el: G(<rect x="4" y="4" width="64" height="20" rx="2"/>) },
  textrows: { name: "Text rows",         el: G(<><line x1="6" y1="8" x2="66" y2="8"/><line x1="6" y1="14" x2="58" y2="14"/><line x1="6" y1="20" x2="62" y2="20"/></>) },
  text2col: { name: "Two column text",   el: G(<><line x1="6" y1="8" x2="32" y2="8"/><line x1="6" y1="14" x2="30" y2="14"/><line x1="6" y1="20" x2="32" y2="20"/><line x1="40" y1="8" x2="66" y2="8"/><line x1="40" y1="14" x2="64" y2="14"/><line x1="40" y1="20" x2="66" y2="20"/></>) },
  cards3:   { name: "Three cards",       el: G(<><rect x="5" y="6" width="17" height="16" rx="2"/><rect x="27" y="6" width="17" height="16" rx="2"/><rect x="49" y="6" width="17" height="16" rx="2"/></>) },
  cards4:   { name: "Four cards",        el: G(<><rect x="4" y="7" width="13" height="14" rx="2"/><rect x="21" y="7" width="13" height="14" rx="2"/><rect x="38" y="7" width="13" height="14" rx="2"/><rect x="55" y="7" width="13" height="14" rx="2"/></>) },
  image:    { name: "Image",             el: G(<><rect x="14" y="4" width="44" height="20" rx="2"/><circle cx="24" cy="11" r="2.4"/><path d="M18 21l9-7 7 5 6-4 8 6"/></>) },
  video:    { name: "Video",             el: G(<><rect x="14" y="4" width="44" height="20" rx="2"/><path d="M33 9l9 5-9 5z" fill="currentColor" stroke="none"/></>) },
  people:   { name: "People cards",      el: G(<><rect x="5" y="5" width="17" height="18" rx="2"/><circle cx="13.5" cy="11" r="2.6"/><line x1="8" y1="19" x2="19" y2="19"/><rect x="27" y="5" width="17" height="18" rx="2"/><circle cx="35.5" cy="11" r="2.6"/><line x1="30" y1="19" x2="41" y2="19"/><rect x="49" y="5" width="17" height="18" rx="2"/><circle cx="57.5" cy="11" r="2.6"/><line x1="52" y1="19" x2="63" y2="19"/></>) },
  accordion:{ name: "Accordion",         el: G(<><rect x="6" y="4" width="60" height="6" rx="1.5"/><rect x="6" y="12" width="60" height="6" rx="1.5"/><rect x="6" y="20" width="60" height="6" rx="1.5"/><path d="M61 6.2l2 2 2-2" strokeWidth="1.2"/></>) },
  search:   { name: "Search",            el: G(<><rect x="8" y="8" width="48" height="11" rx="5.5"/><circle cx="61" cy="13.5" r="4"/><line x1="64" y1="16.5" x2="67" y2="19.5"/></>) },
  map:      { name: "Map / locations",   el: G(<><rect x="14" y="4" width="44" height="20" rx="2"/><path d="M36 9c3 0 5 2.2 5 4.8 0 3-5 7.2-5 7.2s-5-4.2-5-7.2C31 11.2 33 9 36 9z"/><circle cx="36" cy="13.6" r="1.4"/></>) },
  form:     { name: "Form / sign-up",    el: G(<><rect x="6" y="5" width="28" height="7" rx="1.5"/><rect x="6" y="16" width="28" height="7" rx="1.5"/><line x1="40" y1="8" x2="66" y2="8"/><line x1="40" y1="14" x2="60" y2="14"/><rect x="40" y="18" width="16" height="6" rx="3"/></>) },
  stats:    { name: "Statistics",        el: G(<><line x1="12" y1="22" x2="12" y2="12"/><line x1="24" y1="22" x2="24" y2="7"/><line x1="36" y1="22" x2="36" y2="15"/><line x1="48" y1="22" x2="48" y2="9"/><line x1="60" y1="22" x2="60" y2="13"/><line x1="6" y1="22" x2="66" y2="22"/></>) },
  carousel: { name: "Carousel",          el: G(<><path d="M8 14l-3 0" strokeWidth="1.2"/><path d="M6 11l-3 3 3 3" strokeWidth="1.2"/><rect x="12" y="6" width="21" height="16" rx="2"/><rect x="38" y="6" width="21" height="16" rx="2"/><path d="M66 11l3 3-3 3" strokeWidth="1.2"/></>) },
  cta:      { name: "CTA banner",        el: G(<><line x1="8" y1="10" x2="40" y2="10"/><rect x="46" y="8" width="20" height="12" rx="6"/></>) },
  links:    { name: "Link list",         el: G(<><circle cx="9" cy="8" r="1.4" fill="currentColor" stroke="none"/><line x1="14" y1="8" x2="46" y2="8"/><circle cx="9" cy="14" r="1.4" fill="currentColor" stroke="none"/><line x1="14" y1="14" x2="52" y2="14"/><circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none"/><line x1="14" y1="20" x2="42" y2="20"/></>) },
  linker:   { name: "Prev / next linker",el: G(<><path d="M10 14h14" /><path d="M13 10l-4 4 4 4"/><path d="M48 14h14"/><path d="M59 10l4 4-4 4"/></>) },
  quote:    { name: "Quote",             el: G(<><path d="M12 8c-3 1-4 3-4 6h5v6H6v-6c0-4 2-6 6-7z" strokeWidth="1.2"/><line x1="22" y1="10" x2="66" y2="10"/><line x1="22" y1="16" x2="60" y2="16"/><line x1="22" y1="22" x2="48" y2="22"/></>) },
};

export function Glyph({ id }: { id: GlyphId }) {
  return <>{(GLYPHS[id] ?? GLYPHS.textrows).el}</>;
}
