import React from "react";
import type { GlyphId } from "./model";

/* Wireframe elements: schematic line drawings on the block's own colour.
 *
 * Octopus idiom — one thin solid stroke throughout. Hierarchy is arrangement
 * and opacity, never stroke weight. Strokes use non-scaling-stroke so they stay
 * ~1px on screen at any block width (scaled strokes look thick/messy).
 *
 * Spacing is one system:
 *
 *   I   = 4   inset on every side of every SVG
 *   GAP = 6   space between sibling parts (cards, columns, rows)
 *   LH  = 3.2 body-copy line pitch
 *   CSS       uniform pad around label + drawing; extra air above the title
 *
 * Content occupies x:I..72-I and y:I..h-I. Height = content + 2I. */

const I = 4;
const M = I;
const W = 72 - I * 2;
const GAP = 6;
const LH = 3.2;
const SW = 1.1;           // screen px via non-scaling-stroke

/** Uniform pad inside a coloured block — label and drawing share it. */
export const BLOCK_GLYPH_PAD = "px-3 pb-3";
export const BLOCK_LABEL_PAD = "px-3 pt-3 pb-2";

const ve = { vectorEffect: "non-scaling-stroke" as const };

const G = (h: number, children: React.ReactNode) => (
  <svg viewBox={`0 0 72 ${h}`} width="100%" fill="none" stroke="currentColor"
       strokeWidth={SW} strokeLinecap="butt" strokeLinejoin="miter" aria-hidden="true"
       style={{ display: "block", height: "auto" }}>
    {children}
  </svg>
);

/* ---------- primitives ---------- */

const box = (x: number, y: number, w: number, h: number, r = 1, o = 0.55) => (
  <rect x={x} y={y} width={w} height={h} rx={r} opacity={o} style={ve} />
);
/** Active / CTA mark — the only filled shape. */
const solid = (x: number, y: number, w: number, h: number, r = 1, o = 0.85) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" stroke="none" opacity={o} />
);
/** A copy line. Same weight always; length + opacity carry hierarchy. */
const line = (x: number, y: number, w: number, o = 0.55) => (
  <line x1={x} y1={y} x2={x + w} y2={y} opacity={o} style={ve} />
);
const head = (x: number, y: number, w: number) => line(x, y, w, 0.8);
const para = (x: number, y: number, w: number, rows: number, gap = LH, o = 0.45) => (
  <g>{Array.from({ length: rows }, (_, i) => (
    <line key={i} x1={x} y1={y + i * gap} x2={x + (i === rows - 1 ? w * 0.55 : w)} y2={y + i * gap}
          opacity={o} style={ve} />
  ))}</g>
);
const dot = (cx: number, cy: number, r: number, o = 0.75) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" opacity={o} />
);
const ring = (cx: number, cy: number, r: number, o = 0.55) => (
  <circle cx={cx} cy={cy} r={r} opacity={o} style={ve} />
);
/** Picture: frame + simple mountain mark. */
const pic = (x: number, y: number, w: number, h: number, r = 1) => (
  <g>
    {box(x, y, w, h, r, 0.5)}
    <circle cx={x + w * 0.28} cy={y + h * 0.32} r={Math.min(w, h) * 0.06} opacity="0.5" style={ve} />
    <path d={`M${x + w * 0.12} ${y + h * 0.78} L${x + w * 0.38} ${y + h * 0.48} L${x + w * 0.55} ${y + h * 0.64} L${x + w * 0.72} ${y + h * 0.5} L${x + w * 0.9} ${y + h * 0.78}`}
          opacity="0.5" style={ve} />
  </g>
);
const chevL = (x: number, y: number, s = 1.4, o = 0.55) => (
  <path d={`M${x + s} ${y - s} L${x} ${y} L${x + s} ${y + s}`} opacity={o} style={ve} />
);
const chevR = (x: number, y: number, s = 1.4, o = 0.55) => (
  <path d={`M${x} ${y - s} L${x + s} ${y} L${x} ${y + s}`} opacity={o} style={ve} />
);
const chevD = (x: number, y: number, s = 1.2, o = 0.6) => (
  <path d={`M${x - s} ${y - s * 0.55} L${x} ${y + s * 0.55} L${x + s} ${y - s * 0.55}`} opacity={o} style={ve} />
);

type Group = "Structure" | "Text" | "Media" | "Collections" | "Interactive" | "Wayfinding";
type Entry = { name: string; group: Group; h: number; el: React.ReactNode };

export const GLYPH_GROUPS: Group[] = ["Structure", "Text", "Media", "Collections", "Interactive", "Wayfinding"];

const cols = (n: number, gap = GAP) => {
  const w = (W - gap * (n - 1)) / n;
  return { w, x: (i: number) => M + i * (w + gap) };
};

export const GLYPHS: Record<GlyphId, Entry> = {
  /* ---------------- Structure ---------------- */
  hero: { name: "Hero", group: "Structure", h: 24, el: G(24, <>
    {head(M, I, 30)}
    {head(M, I + 3.5, 20)}
    {para(M, I + 8.5, 34, 2)}
    {solid(M, I + 15.5, 11, 2.5, 1.2)}
  </>) },
  herosplit: { name: "Hero, split", group: "Structure", h: 24, el: G(24, <>
    {head(M, I, 18)}
    {head(M, I + 3.5, 12)}
    {para(M, I + 8.5, 20, 2)}
    {solid(M, I + 15.5, 10, 2.5, 1.2)}
    {pic(M + 28, I, W - 28, 16)}
  </>) },
  banner: { name: "Notice bar", group: "Structure", h: 12, el: G(12, <>
    {box(M, I, W, 4, 2, 0.45)}
    {dot(M + 2.5, I + 2, 0.9, 0.7)}
    {line(M + 6, I + 2, 34, 0.5)}
    <path d={`M${72 - I - 4.5} ${I + 0.7}l2.4 2.4M${72 - I - 2.1} ${I + 0.7}l-2.4 2.4`} opacity="0.5" style={ve} />
  </>) },
  tabs: { name: "Tabs", group: "Structure", h: 22, el: G(22, <>
    {solid(M, I, 11, 2.8, 1.4, 0.8)}
    {box(M + 14, I, 11, 2.8, 1.4, 0.45)}
    {box(M + 28, I, 11, 2.8, 1.4, 0.45)}
    {line(M, I + 5.5, W, 0.3)}
    {head(M, I + 9, 18)}
    {para(M, I + 13, W, 2)}
  </>) },
  sidebar: { name: "Content + sidebar", group: "Structure", h: 24, el: G(24, <>
    {box(M, I, 13, 16, 1, 0.45)}
    {line(M + 2, I + 3, 9, 0.45)}{line(M + 2, I + 6.5, 7, 0.45)}
    {line(M + 2, I + 10, 9, 0.45)}{line(M + 2, I + 13.5, 6, 0.45)}
    {head(M + 20, I + 1, 22)}
    {para(M + 20, I + 6, 38, 4)}
  </>) },
  breadcrumb: { name: "Breadcrumb", group: "Structure", h: 10, el: G(10, <>
    {line(M, 5, 8, 0.4)}
    {chevR(M + 10, 5, 1.1, 0.4)}
    {line(M + 13.5, 5, 10, 0.4)}
    {chevR(M + 25.5, 5, 1.1, 0.4)}
    {line(M + 29, 5, 12, 0.75)}
  </>) },
  footercols: { name: "Footer columns", group: "Structure", h: 22, el: G(22, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4);
      return (
        <g key={i}>
          {head(c.x(i), I, c.w * 0.65)}
          {line(c.x(i), I + 5, c.w * 0.9, 0.4)}
          {line(c.x(i), I + 8.5, c.w * 0.6, 0.4)}
          {line(c.x(i), I + 12, c.w * 0.75, 0.4)}
        </g>
      );
    })}
    {line(M, 22 - I, W, 0.25)}
  </>) },

  /* ---------------- Text ---------------- */
  textrows: { name: "Text rows", group: "Text", h: 20, el: G(20, <>
    {para(M, I, W, 5)}
  </>) },
  text2col: { name: "Two column text", group: "Text", h: 20, el: G(20, <>
    {para(M, I, (W - GAP) / 2, 5)}
    {para(M + (W - GAP) / 2 + GAP, I, (W - GAP) / 2, 5)}
  </>) },
  article: { name: "Article", group: "Text", h: 22, el: G(22, <>
    {head(M, I, 32)}
    {line(M, I + 4.5, 14, 0.4)}
    {line(M, I + 8, W, 0.25)}
    {para(M, I + 11.5, W, 3)}
  </>) },
  quote: { name: "Quote", group: "Text", h: 16, el: G(16, <>
    <path d={`M${M + 2.5} ${I}c-1.5.6-2.3 1.6-2.3 3.1h2.5v2.5H${M} V${I + 3.1}C${M} ${I + 1.4} ${M + 1.1} ${I + 0.3} ${M + 2.5} ${I - 0.1}z`}
          fill="currentColor" stroke="none" opacity="0.35" />
    {head(M + 9, I + 2, 40)}
    {head(M + 9, I + 5.5, 32)}
    {line(M + 9, I + 9, 12, 0.4)}
  </>) },
  testimonial: { name: "Testimonial", group: "Text", h: 18, el: G(18, <>
    {box(M, I, W, 10, 1, 0.45)}
    {ring(M + 6, I + 5, 2.2, 0.5)}
    {para(M + 12, I + 3, 40, 2, 2.8)}
    {line(M + 12, I + 9.5, 12, 0.4)}
  </>) },

  /* ---------------- Media ---------------- */
  image: { name: "Image", group: "Media", h: 22, el: G(22, <>
    {pic(M, I, W, 12)}
    {line(M, I + 14.5, 20, 0.4)}
  </>) },
  video: { name: "Video", group: "Media", h: 20, el: G(20, <>
    {box(M, I, W, 12, 1, 0.5)}
    {ring(36, I + 6, 3, 0.55)}
    <path d={`M35.2 ${I + 4.5}l2.4 1.5-2.4 1.5z`} fill="currentColor" stroke="none" opacity="0.8" />
  </>) },
  gallery: { name: "Gallery", group: "Media", h: 20, el: G(20, <>
    {pic(M, I, (W - GAP) * 0.55, 12)}
    {pic(M + (W - GAP) * 0.55 + GAP, I, (W - GAP) * 0.45, 5)}
    {pic(M + (W - GAP) * 0.55 + GAP, I + 7, (W - GAP) * 0.45, 5)}
  </>) },
  logos: { name: "Logo strip", group: "Media", h: 12, el: G(12, <>
    {[0, 1, 2, 3, 4].map(i => {
      const c = cols(5);
      return <g key={i}>{box(c.x(i), I, c.w, 4, 1, 0.45)}</g>;
    })}
  </>) },
  split: { name: "Media + text", group: "Media", h: 22, el: G(22, <>
    {pic(M, I, 22, 14)}
    {head(M + 30, I + 1, 22)}
    {para(M + 30, I + 6, 28, 2)}
    {solid(M + 30, I + 13, 10, 2.5, 1.2)}
  </>) },

  /* ---------------- Collections ---------------- */
  cards3: { name: "Three cards", group: "Collections", h: 22, el: G(22, <>
    {head(M, I, 16)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), I + 5.5, c.w, 9, 1, 0.5)}
          {line(c.x(i) + 1.5, I + 11, c.w - 3, 0.45)}
          {line(c.x(i) + 1.5, I + 13.2, c.w - 5, 0.35)}
        </g>
      );
    })}
  </>) },
  cards4: { name: "Four cards", group: "Collections", h: 18, el: G(18, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4);
      return (
        <g key={i}>
          {box(c.x(i), I, c.w, 10, 1, 0.5)}
          {line(c.x(i) + 1, I + 7, c.w - 2, 0.45)}
          {line(c.x(i) + 1, I + 9.5, c.w - 3.5, 0.35)}
        </g>
      );
    })}
  </>) },
  grid2x2: { name: "Feature grid", group: "Collections", h: 24, el: G(24, <>
    {[0, 1].flatMap(r => [0, 1].map(i => {
      const c = cols(2);
      const y = I + r * (6 + GAP);
      return (
        <g key={`${r}-${i}`}>
          {box(c.x(i), y, c.w, 6, 1, 0.45)}
          {dot(c.x(i) + 2.5, y + 3, 1, 0.65)}
          {line(c.x(i) + 5.5, y + 2.2, c.w - 9, 0.5)}
          {line(c.x(i) + 5.5, y + 4.2, c.w - 12, 0.35)}
        </g>
      );
    }))}
  </>) },
  people: { name: "People cards", group: "Collections", h: 22, el: G(22, <>
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), I, c.w, 14, 1, 0.5)}
          {ring(c.x(i) + c.w / 2, I + 4.5, 2.2, 0.55)}
          {line(c.x(i) + 2, I + 9.5, c.w - 4, 0.5)}
          {line(c.x(i) + 3, I + 12, c.w - 6, 0.35)}
        </g>
      );
    })}
  </>) },
  carousel: { name: "Carousel", group: "Collections", h: 20, el: G(20, <>
    {chevL(M, I + 5, 1.3, 0.5)}
    {box(M + 5, I, 22, 10, 1, 0.5)}{line(M + 7, I + 7.5, 14, 0.4)}
    {box(M + 33, I, 22, 10, 1, 0.5)}{line(M + 35, I + 7.5, 14, 0.4)}
    {chevR(72 - I - 1.3, I + 5, 1.3, 0.5)}
    {[0, 1, 2].map(i => <circle key={i} cx={33 + i * 3} cy={20 - I} r="0.6" fill="currentColor" stroke="none" opacity={i === 0 ? 0.85 : 0.3} />)}
  </>) },
  related: { name: "Related content", group: "Collections", h: 22, el: G(22, <>
    {head(M, I, 14)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), I + 5.5, c.w, 6, 1, 0.45)}
          {line(c.x(i), I + 13.5, c.w * 0.85, 0.45)}
          {line(c.x(i), I + 16, c.w * 0.5, 0.3)}
        </g>
      );
    })}
  </>) },
  listrows: { name: "Listing rows", group: "Collections", h: 32, el: G(32, <>
    {[0, 1, 2].map(i => {
      const y = I + i * (5 + GAP);
      return (
        <g key={i}>
          {box(M, y, W, 5, 1, 0.45)}
          {box(M + 1.5, y + 1, 4, 3, 0.6, 0.4)}
          {line(M + 8, y + 1.6, 18, 0.55)}
          {line(M + 8, y + 3.4, 26, 0.35)}
          {solid(72 - I - 7, y + 1.3, 6.5, 2.4, 1.2, 0.8)}
        </g>
      );
    })}
  </>) },
  table: { name: "Table", group: "Collections", h: 20, el: G(20, <>
    {box(M, I, W, 3.2, 0.8, 0.35)}
    {[0, 1, 2].map(i => <line key={i} x1={M + 2 + i * 18} y1={I + 1.6} x2={M + 11 + i * 18} y2={I + 1.6} opacity="0.7" style={ve} />)}
    {[0, 1, 2, 3].map(r => (
      <g key={r}>
        {[0, 1, 2].map(i => <line key={i} x1={M + 2 + i * 18} y1={I + 5.5 + r * 2.5} x2={M + (i === 0 ? 12 : 9) + i * 18} y2={I + 5.5 + r * 2.5} opacity="0.4" style={ve} />)}
      </g>
    ))}
    <g opacity="0.2">
      <line x1="26" y1={I} x2="26" y2={20 - I} style={ve} /><line x1="44" y1={I} x2="44" y2={20 - I} style={ve} />
    </g>
  </>) },
  pricing: { name: "Pricing", group: "Collections", h: 24, el: G(24, <>
    {[0, 1, 2].map(i => {
      const c = cols(3);
      const mid = i === 1;
      const y = mid ? I : I + 2;
      const h = mid ? 16 : 12;
      return (
        <g key={i}>
          {box(c.x(i), y, c.w, h, 1, mid ? 0.65 : 0.45)}
          {line(c.x(i) + 1.5, y + 2.5, c.w - 5, 0.4)}
          {head(c.x(i) + 1.5, y + 5.5, c.w - 4)}
          {line(c.x(i) + 1.5, y + 8.5, c.w - 3, 0.35)}
          {mid ? solid(c.x(i) + 1.5, y + 11.5, c.w - 3, 2.5, 1.2)
               : box(c.x(i) + 1.5, y + 10.5, c.w - 3, 2.2, 1, 0.45)}
        </g>
      );
    })}
  </>) },

  /* ---------------- Interactive ---------------- */
  search: { name: "Search", group: "Interactive", h: 12, el: G(12, <>
    {ring(M + 1.5, I + 2, 1.4, 0.55)}
    <path d={`M${M + 2.6} ${I + 3.1}l1.2 1.2`} opacity="0.55" style={ve} />
    {box(M + 7, I, 38, 4, 2, 0.5)}
    {line(M + 10, I + 2, 22, 0.3)}
    {solid(72 - I - 11, I, 11, 4, 2)}
  </>) },
  filters: { name: "Filters + results", group: "Interactive", h: 26, el: G(26, <>
    {box(M, I, 12, 18, 1, 0.45)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        {i === 0 ? solid(M + 2, I + 2.5 + i * 4, 2, 2, 0.5)
                 : box(M + 2, I + 2.5 + i * 4, 2, 2, 0.5, 0.5)}
        {line(M + 5.5, I + 3.5 + i * 4, 5.5, 0.45)}
      </g>
    ))}
    {[0, 1, 2].map(i => {
      const y = I + i * 6.5;
      return (
        <g key={i}>
          {box(M + 18, y, W - 18, 4.5, 1, 0.45)}
          {line(M + 20, y + 1.5, 14, 0.55)}
          {line(M + 20, y + 3, 24, 0.35)}
        </g>
      );
    })}
  </>) },
  form: { name: "Form / sign-up", group: "Interactive", h: 24, el: G(24, <>
    {[0, 1].map(i => (
      <g key={i}>
        {line(M, I + i * 7.5, 8, 0.4)}
        {box(M, I + 2 + i * 7.5, 24, 3.5, 1, 0.5)}
      </g>
    ))}
    {line(M + 30, I, 10, 0.4)}
    {box(M + 30, I + 2, 26, 3.5, 1, 0.5)}
    {box(M + 30, I + 9, 2, 2, 0.5, 0.5)}
    {line(M + 34, I + 10, 16, 0.4)}
    {solid(M + 30, I + 13.5, 12, 3, 1.5)}
  </>) },
  cta: { name: "CTA banner", group: "Interactive", h: 14, el: G(14, <>
    {box(M, I, W, 6, 1.5, 0.3)}
    {head(M + 3, I + 2, 22)}
    {line(M + 3, I + 4.5, 16, 0.4)}
    {solid(72 - I - 12, I + 1.5, 11, 3, 1.5)}
  </>) },
  accordion: { name: "Accordion", group: "Interactive", h: 20, el: G(20, <>
    {box(M, I, W, 4, 1, 0.55)}
    {line(M + 2, I + 2, 18, 0.6)}
    {chevD(72 - I - 3.5, I + 1.8, 1.1, 0.65)}
    {para(M + 2, I + 7, 42, 2, 2.8)}
    {box(M, I + 13, W, 3, 1, 0.4)}
    {line(M + 2, I + 14.5, 14, 0.4)}
  </>) },
  steps: { name: "Process steps", group: "Interactive", h: 16, el: G(16, <>
    <line x1={M + 4} y1={I + 2} x2={72 - I - 4} y2={I + 2} opacity="0.25" style={ve} />
    {[0, 1, 2, 3].map(i => {
      const cx = M + 4 + i * ((W - 8) / 3);
      return (
        <g key={i}>
          {i === 0 ? dot(cx, I + 2, 1.6, 0.85) : <circle cx={cx} cy={I + 2} r="1.6" fill="none" opacity="0.45" style={ve} />}
          {line(cx - 3.5, I + 6, 7, 0.4)}
          {line(cx - 2.5, I + 8.5, 5, 0.3)}
        </g>
      );
    })}
  </>) },
  toggle: { name: "Toggle / compare", group: "Interactive", h: 12, el: G(12, <>
    {line(M, I + 2, 9, 0.4)}
    {box(M + 14, I, 16, 4, 2, 0.5)}
    {solid(M + 15, I + 0.7, 6.5, 2.6, 1.3)}
    {line(M + 34, I + 2, 14, 0.4)}
  </>) },

  /* ---------------- Wayfinding ---------------- */
  links: { name: "Link list", group: "Wayfinding", h: 20, el: G(20, <>
    {head(M, I, 12)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        {dot(M + 1, I + 5.5 + i * 2.8, 0.6, 0.7)}
        {line(M + 4, I + 5.5 + i * 2.8, [36, 44, 28, 40][i], 0.45)}
      </g>
    ))}
  </>) },
  linker: { name: "Prev / next", group: "Wayfinding", h: 14, el: G(14, <>
    {box(M, I, 26, 6, 1, 0.45)}
    {chevL(M + 3, I + 3, 1.2, 0.55)}
    {line(M + 6.5, I + 1.8, 5, 0.35)}{line(M + 6.5, I + 4, 12, 0.5)}
    {box(M + 34, I, 26, 6, 1, 0.45)}
    {line(M + 37.5, I + 1.8, 5, 0.35)}{line(M + 37.5, I + 4, 12, 0.5)}
    {chevR(72 - I - 3, I + 3, 1.2, 0.55)}
  </>) },
  map: { name: "Map / locations", group: "Wayfinding", h: 20, el: G(20, <>
    {box(M, I, 34, 12, 1, 0.5)}
    <g opacity="0.25">
      <path d={`M${M} ${I + 5} L${M + 11} ${I + 2} L${M + 20} ${I + 8} L${M + 34} ${I + 3}`} style={ve} />
      <path d={`M${M} ${I + 9} L${M + 10} ${I + 7.5} L${M + 20} ${I + 11} L${M + 34} ${I + 8.5}`} style={ve} />
    </g>
    <path d={`M${M + 16} ${I + 3}c1.5 0 2.6 1.2 2.6 2.6 0 1.5-2.6 3.8-2.6 3.8s-2.6-2.3-2.6-3.8c0-1.4 1.1-2.6 2.6-2.6z`}
          fill="currentColor" stroke="none" opacity="0.85" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        {line(M + 38, I + 1.5 + i * 4, 12, 0.55)}
        {line(M + 38, I + 3.5 + i * 4, 16, 0.35)}
      </g>
    ))}
  </>) },
  contact: { name: "Contact details", group: "Wayfinding", h: 18, el: G(18, <>
    {box(M, I, 20, 10, 1, 0.5)}
    {box(M + 2.5, I + 2.5, 15, 6, 0.8, 0.5)}
    <path d={`M${M + 4} ${I + 3}l5.5 3.6 5.5-3.6`} opacity="0.45" style={ve} />
    {[0, 1, 2].map(i => (
      <g key={i}>
        {dot(M + 26, I + 2 + i * 3.5, 0.85, 0.7)}
        {line(M + 29, I + 2 + i * 3.5, [20, 14, 18][i], 0.45)}
      </g>
    ))}
  </>) },
  stats: { name: "Statistics", group: "Wayfinding", h: 16, el: G(16, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4);
      return (
        <g key={i}>
          {head(c.x(i), I + 1, c.w * 0.7)}
          {line(c.x(i), I + 5.5, c.w, 0.4)}
          {line(c.x(i), I + 8, c.w * 0.6, 0.3)}
        </g>
      );
    })}
    {line(M, 16 - I, W, 0.22)}
  </>) },
};

export function Glyph({ id }: { id: GlyphId }) {
  return <>{(GLYPHS[id] ?? GLYPHS.textrows).el}</>;
}

/** A block's wireframe: its elements stacked in order.
 *  Slightly inset from the block pad so the drawing reads smaller than the chip.
 *  Soft opaque plate behind the line work so it reads against the intent colour.
 *  Pass className to replace the default centered width (e.g. mobile detail). */
export function Wireframe({ ids, gap = GAP, className }: { ids: GlyphId[]; gap?: number; accent?: string; className?: string }) {
  const list = ids?.length ? ids : (["textrows"] as GlyphId[]);
  return (
    <div className={`flex flex-col rounded-md bg-white/20 px-1.5 py-1.5 ${className ?? "w-[86%] mx-auto"}`} style={{ gap }}>
      {list.map((id, i) => <Glyph key={`${id}-${i}`} id={id} />)}
    </div>
  );
}
