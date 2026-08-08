import React from "react";
import type { GlyphId } from "./model";

/* Wireframe elements: schematic line drawings on the block's own colour.
 *
 * The idiom is deliberately technical rather than decorative. Everything is
 * drawn in currentColor - which is the block's foreground on its intent
 * colour - at three weights, with one uniform stroke and one radius scale:
 *
 *   outline   thin stroked box, the container a thing sits in
 *   line      a run of copy, or a rule
 *   solid     the few things a visitor acts on, or an active state
 *
 * No fills beyond those, no shadows, no illustration. What varies between
 * elements is the *arrangement* and the *height*: a notice bar is 10 units
 * tall on the 72-wide canvas and a hero is 32, so a stack of blocks reads
 * with the rhythm of a real page instead of as a column of equal icons.
 *
 * Content lives in x:5..67. */

const M = 6;              // side margin
const W = 72 - M * 2;     // content width, 62

const G = (h: number, children: React.ReactNode) => (
  // No height attribute: with a viewBox and width 100%, the element takes its
  // intrinsic ratio and the drawing fills the width it is given.
  <svg viewBox={`0 0 72 ${h}`} width="100%" fill="none" stroke="currentColor"
       strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ display: "block", height: "auto" }}>
    {children}
  </svg>
);

/* ---------- primitives ---------- */

/** Stroked container: a card, a field, a region. */
const box = (x: number, y: number, w: number, h: number, r = 1.5, o = 0.5) => (
  <rect x={x} y={y} width={w} height={h} rx={r} opacity={o} />
);
/** Barely-there surface, for areas that are filled rather than outlined. */
const soft = (x: number, y: number, w: number, h: number, r = 1.5, o = 0.16) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" stroke="none" opacity={o} />
);
/** Solid mark: buttons, the active tab, the selected state. */
const solid = (x: number, y: number, w: number, h: number, r = 1.5, o = 0.92) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" stroke="none" opacity={o} />
);
/** A line of copy. Heavier and shorter reads as a heading. */
const line = (x: number, y: number, w: number, o = 0.62, sw = 1.1) => (
  <line x1={x} y1={y} x2={x + w} y2={y} opacity={o} strokeWidth={sw} />
);
/** A run of copy lines, ragged at the end like real text. */
const para = (x: number, y: number, w: number, rows: number, gap = 3.8, o = 0.5) => (
  <g>{Array.from({ length: rows }, (_, i) => (
    <line key={i} x1={x} y1={y + i * gap} x2={x + (i === rows - 1 ? w * 0.6 : w)} y2={y + i * gap}
          opacity={o} strokeWidth="1.1" />
  ))}</g>
);
const dot = (cx: number, cy: number, r: number, o = 0.8) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" opacity={o} />
);
const ring = (cx: number, cy: number, r: number, o = 0.5) => <circle cx={cx} cy={cy} r={r} opacity={o} />;
/** Picture mark: a horizon inside a frame, drawn not filled. */
const pic = (x: number, y: number, w: number, h: number, r = 1.5) => (
  <g>
    {box(x, y, w, h, r, 0.42)}
    <circle cx={x + w * 0.26} cy={y + h * 0.3} r={Math.min(w, h) * 0.08} opacity="0.55" />
    <path d={`M${x + w * 0.1} ${y + h * 0.8} L${x + w * 0.36} ${y + h * 0.5} L${x + w * 0.55} ${y + h * 0.66} L${x + w * 0.7} ${y + h * 0.54} L${x + w * 0.9} ${y + h * 0.8}`}
          opacity="0.55" />
  </g>
);
const chevL = (x: number, y: number, s = 1.8, o = 0.6) => (
  <path d={`M${x + s} ${y - s} L${x} ${y} L${x + s} ${y + s}`} opacity={o} />
);
const chevR = (x: number, y: number, s = 1.8, o = 0.6) => (
  <path d={`M${x} ${y - s} L${x + s} ${y} L${x} ${y + s}`} opacity={o} />
);
const chevD = (x: number, y: number, s = 1.6, o = 0.7) => (
  <path d={`M${x - s} ${y - s * 0.6} L${x} ${y + s * 0.6} L${x + s} ${y - s * 0.6}`} opacity={o} />
);

type Group = "Structure" | "Text" | "Media" | "Collections" | "Interactive" | "Wayfinding";
type Entry = { name: string; group: Group; h: number; el: React.ReactNode };

export const GLYPH_GROUPS: Group[] = ["Structure", "Text", "Media", "Collections", "Interactive", "Wayfinding"];

/** Column geometry for an n-across grid inside the content width. */
const cols = (n: number, gap = 2.5) => {
  const w = (W - gap * (n - 1)) / n;
  return { w, x: (i: number) => M + i * (w + gap) };
};

export const GLYPHS: Record<GlyphId, Entry> = {
  /* ---------------- Structure ---------------- */
  hero: { name: "Hero", group: "Structure", h: 38, el: G(38, <g transform="translate(0 3)">
    {line(M, 9, 40, 0.9, 2.4)}
    {line(M, 14, 28, 0.9, 2.4)}
    {para(M, 19, 42, 2, 3.2, 0.45)}
    {solid(M, 25, 17, 4.5, 2.25)}
  </g>) },
  herosplit: { name: "Hero, split", group: "Structure", h: 36, el: G(36, <g transform="translate(0 3)">
    {line(M, 8, 26, 0.9, 2.4)}
    {line(M, 13, 18, 0.9, 2.4)}
    {para(M, 18, 27, 2, 3.2, 0.45)}
    {solid(M, 24, 15, 4.2, 2.1)}
    {pic(39, 4, 28, 22, 2)}
  </g>) },
  banner: { name: "Notice bar", group: "Structure", h: 12, el: G(12, <g transform="translate(0 1)">
    {soft(M, 2, W, 6, 3)}
    {dot(M + 3.5, 5, 1.4, 0.75)}
    {line(M + 8, 5, 34, 0.6)}
    <path d="M62 3.4l3.2 3.2M65.2 3.4l-3.2 3.2" opacity="0.6" />
  </g>) },
  tabs: { name: "Tabs", group: "Structure", h: 31, el: G(31, <g transform="translate(0 2.5)">
    {solid(M, 3, 15, 4.5, 2.25, 0.85)}
    {box(M + 17, 3, 15, 4.5, 2.25, 0.45)}
    {box(M + 34, 3, 15, 4.5, 2.25, 0.45)}
    {line(M, 11, W, 0.28)}
    {line(M, 15, 26, 0.75, 1.8)}
    {para(M, 19.5, W, 2, 3.2, 0.45)}
  </g>) },
  sidebar: { name: "Content + sidebar", group: "Structure", h: 35, el: G(35, <g transform="translate(0 2.5)">
    {box(M, 3, 17, 24, 2, 0.4)}
    {line(M + 3, 8, 11, 0.5)}{line(M + 3, 12, 9, 0.5)}{line(M + 3, 16, 11, 0.5)}{line(M + 3, 20, 8, 0.5)}
    {line(26, 5, 28, 0.85, 2.2)}
    {para(26, 11, 40, 5, 3.4, 0.45)}
  </g>) },
  breadcrumb: { name: "Breadcrumb", group: "Structure", h: 10, el: G(10, <g transform="translate(0 1)">
    {line(M, 4, 9, 0.45)}
    {chevR(17, 4, 1.4, 0.45)}
    {line(21, 4, 11, 0.45)}
    {chevR(35, 4, 1.4, 0.45)}
    {line(39, 4, 15, 0.85, 1.6)}
  </g>) },
  footercols: { name: "Footer columns", group: "Structure", h: 31, el: G(31, <g transform="translate(0 2.5)">
    {[0, 1, 2, 3].map(i => {
      const c = cols(4, 3);
      return (
        <g key={i}>
          {line(c.x(i), 5, c.w * 0.7, 0.8, 1.6)}
          {line(c.x(i), 10, c.w * 0.9, 0.42)}{line(c.x(i), 14, c.w * 0.65, 0.42)}{line(c.x(i), 18, c.w * 0.8, 0.42)}
        </g>
      );
    })}
    {line(M, 23, W, 0.25)}
  </g>) },

  /* ---------------- Text ---------------- */
  textrows: { name: "Text rows", group: "Text", h: 26, el: G(26, <g transform="translate(0 3)">
    {para(M, 4, W, 5, 3.2, 0.55)}
  </g>) },
  text2col: { name: "Two column text", group: "Text", h: 28, el: G(28, <g transform="translate(0 3)">
    {para(M, 4, 28, 5, 3.4, 0.55)}
    {para(39, 4, 28, 5, 3.4, 0.55)}
  </g>) },
  article: { name: "Article", group: "Text", h: 34, el: G(34, <g transform="translate(0 3)">
    {line(M, 5, 42, 0.9, 2.4)}
    {line(M, 10, 22, 0.45)}
    {line(M, 14, W, 0.25)}
    {para(M, 18, W, 3, 3.2, 0.5)}
  </g>) },
  quote: { name: "Quote", group: "Text", h: 24, el: G(24, <g transform="translate(0 2)">
    <path d="M8.4 5c-2.2.8-3.4 2.3-3.4 4.5h3.6v3.9H4.6V9.5C4.6 7 6.1 5.4 8.4 4.4z" fill="currentColor" stroke="none" opacity="0.4" />
    {line(15, 7, 46, 0.8, 1.8)}
    {line(15, 11.5, 38, 0.8, 1.8)}
    {line(15, 16, 20, 0.4)}
  </g>) },
  testimonial: { name: "Testimonial", group: "Text", h: 28, el: G(28, <g transform="translate(0 2)">
    {box(M, 3, W, 18, 2, 0.4)}
    {ring(13, 10, 3.6, 0.55)}
    {para(20, 8, 40, 2, 3.2, 0.5)}
    {line(20, 17, 15, 0.4)}
  </g>) },

  /* ---------------- Media ---------------- */
  image: { name: "Image", group: "Media", h: 32, el: G(32, <g transform="translate(0 2)">
    {pic(M, 3, W, 18, 2)}
    {line(M, 25, 28, 0.4)}
  </g>) },
  video: { name: "Video", group: "Media", h: 32, el: G(32, <g transform="translate(0 2)">
    {box(M, 3, W, 22, 2, 0.42)}
    {ring(36, 14, 5, 0.6)}
    <path d="M34.4 11.4l3.8 2.6-3.8 2.6z" fill="currentColor" stroke="none" opacity="0.85" />
  </g>) },
  gallery: { name: "Gallery", group: "Media", h: 30, el: G(30, <g transform="translate(0 2)">
    {pic(M, 3, 29, 20, 2)}
    {pic(37, 3, 30, 9, 2)}
    {pic(37, 14, 30, 9, 2)}
  </g>) },
  logos: { name: "Logo strip", group: "Media", h: 15, el: G(15, <g transform="translate(0 1.5)">
    {[0, 1, 2, 3, 4].map(i => {
      const c = cols(5, 3);
      return <rect key={i} x={c.x(i)} y="4" width={c.w} height="4.5" rx="1.5" opacity="0.42" />;
    })}
  </g>) },
  split: { name: "Media + text", group: "Media", h: 32, el: G(32, <g transform="translate(0 2)">
    {pic(M, 3, 27, 22, 2)}
    {line(37, 6, 26, 0.85, 2.2)}
    {para(37, 12, 28, 2, 3.2, 0.45)}
    {solid(37, 20, 15, 4.2, 2.1)}
  </g>) },

  /* ---------------- Collections ---------------- */
  cards3: { name: "Three cards", group: "Collections", h: 33, el: G(33, <g transform="translate(0 2.5)">
    {line(M, 4, 24, 0.8, 1.8)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), 9, c.w, 16, 2, 0.45)}
          {line(c.x(i) + 2, 19, c.w - 4, 0.45)}
          {line(c.x(i) + 2, 22, c.w - 8, 0.35)}
        </g>
      );
    })}
  </g>) },
  cards4: { name: "Four cards", group: "Collections", h: 28, el: G(28, <g transform="translate(0 2)">
    {[0, 1, 2, 3].map(i => {
      const c = cols(4, 2);
      return (
        <g key={i}>
          {box(c.x(i), 3, c.w, 18, 2, 0.45)}
          {line(c.x(i) + 1.5, 15, c.w - 3, 0.45)}
          {line(c.x(i) + 1.5, 18, c.w - 6, 0.35)}
        </g>
      );
    })}
  </g>) },
  grid2x2: { name: "Feature grid", group: "Collections", h: 31, el: G(31, <g transform="translate(0 2.5)">
    {[0, 1].map(r => [0, 1].map(i => {
      const c = cols(2, 3);
      const y = 3 + r * 11;
      return (
        <g key={`${r}-${i}`}>
          {box(c.x(i), y, c.w, 9, 2, 0.42)}
          {dot(c.x(i) + 4, y + 4.5, 1.6, 0.7)}
          {line(c.x(i) + 8, y + 3.4, c.w - 12, 0.5)}
          {line(c.x(i) + 8, y + 6.4, c.w - 17, 0.35)}
        </g>
      );
    }))}
  </g>) },
  people: { name: "People cards", group: "Collections", h: 32, el: G(32, <g transform="translate(0 2)">
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), 3, c.w, 21, 2, 0.45)}
          {ring(c.x(i) + c.w / 2, 10, 3.8, 0.6)}
          {line(c.x(i) + 2.5, 17.5, c.w - 5, 0.5)}
          {line(c.x(i) + 4.5, 20.5, c.w - 9, 0.35)}
        </g>
      );
    })}
  </g>) },
  carousel: { name: "Carousel", group: "Collections", h: 30, el: G(30, <g transform="translate(0 2)">
    {chevL(4, 12, 2, 0.6)}
    {box(10, 3, 24, 17, 2, 0.45)}{line(12.5, 15, 17, 0.42)}
    {box(37, 3, 24, 17, 2, 0.45)}{line(39.5, 15, 17, 0.42)}
    {chevR(66, 12, 2, 0.6)}
    {[0, 1, 2].map(i => <circle key={i} cx={33 + i * 3} cy="23" r="0.9" fill="currentColor" stroke="none" opacity={i === 0 ? 0.9 : 0.3} />)}
  </g>) },
  related: { name: "Related content", group: "Collections", h: 31, el: G(31, <g transform="translate(0 2.5)">
    {line(M, 4, 22, 0.8, 1.8)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {box(c.x(i), 9, c.w, 9, 2, 0.42)}
          {line(c.x(i), 21, c.w * 0.9, 0.45)}
          {line(c.x(i), 24, c.w * 0.6, 0.3)}
        </g>
      );
    })}
  </g>) },
  listrows: { name: "Listing rows", group: "Collections", h: 33, el: G(33, <g transform="translate(0 2.5)">
    {[0, 1, 2].map(i => {
      const y = 3 + i * 8.4;
      return (
        <g key={i}>
          {box(M, y, W, 7, 1.5, 0.4)}
          {soft(M + 1.5, y + 1.2, 7, 4.6, 1)}
          {line(M + 11, y + 2.6, 22, 0.6)}
          {line(M + 11, y + 5, 30, 0.35)}
          {solid(56, y + 2, 9, 3.2, 1.6, 0.85)}
        </g>
      );
    })}
  </g>) },
  table: { name: "Table", group: "Collections", h: 30, el: G(30, <g transform="translate(0 2)">
    {soft(M, 3, W, 5, 1.5, 0.2)}
    {[0, 1, 2].map(i => <line key={i} x1={M + 2 + i * 20} y1="5.5" x2={M + 14 + i * 20} y2="5.5" opacity="0.8" strokeWidth="1.4" />)}
    {[0, 1, 2, 3].map(r => (
      <g key={r}>
        {[0, 1, 2].map(i => <line key={i} x1={M + 2 + i * 20} y1={11.5 + r * 4.2} x2={M + (i === 0 ? 16 : 12) + i * 20} y2={11.5 + r * 4.2} opacity="0.4" />)}
      </g>
    ))}
    <g opacity="0.22">
      <line x1="24" y1="3" x2="24" y2="25" /><line x1="44" y1="3" x2="44" y2="25" />
    </g>
  </g>) },
  pricing: { name: "Pricing", group: "Collections", h: 34, el: G(34, <g transform="translate(0 2)">
    {[0, 1, 2].map(i => {
      const c = cols(3);
      const mid = i === 1;
      const y = mid ? 2 : 5;
      const h = mid ? 25 : 20;
      return (
        <g key={i}>
          {box(c.x(i), y, c.w, h, 2, mid ? 0.7 : 0.4)}
          {line(c.x(i) + 2.5, y + 4, c.w - 9, 0.4)}
          {line(c.x(i) + 2.5, y + 8.5, c.w - 6, 0.9, 2.4)}
          {line(c.x(i) + 2.5, y + 13, c.w - 5, 0.35)}
          {mid ? solid(c.x(i) + 2.5, y + 18, c.w - 5, 4, 2)
               : box(c.x(i) + 2.5, y + 15, c.w - 5, 3.6, 1.8, 0.45)}
        </g>
      );
    })}
  </g>) },

  /* ---------------- Interactive ---------------- */
  search: { name: "Search", group: "Interactive", h: 15, el: G(15, <g transform="translate(0 1.5)">
    {box(M, 3, 48, 7, 3.5, 0.5)}
    {ring(10.5, 6.5, 2, 0.6)}
    <path d="M12 8l1.6 1.6" opacity="0.6" />
    {line(16.5, 6.5, 22, 0.35)}
    {solid(56, 3, 11, 7, 3.5)}
  </g>) },
  filters: { name: "Filters + results", group: "Interactive", h: 35, el: G(35, <g transform="translate(0 2.5)">
    {box(M, 3, 17, 24, 2, 0.4)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        {i === 0 ? solid(M + 2.5, 6.5 + i * 5.2, 2.8, 2.8, 0.8)
                 : box(M + 2.5, 6.5 + i * 5.2, 2.8, 2.8, 0.8, 0.5)}
        {line(M + 7, 8 + i * 5.2, 8.5, 0.45)}
      </g>
    ))}
    {[0, 1, 2].map(i => (
      <g key={i}>
        {box(26, 3 + i * 8.4, 41, 7, 1.5, 0.42)}
        {line(28.5, 5.4 + i * 8.4, 18, 0.6)}
        {line(28.5, 7.8 + i * 8.4, 28, 0.35)}
      </g>
    ))}
  </g>) },
  form: { name: "Form / sign-up", group: "Interactive", h: 35, el: G(35, <g transform="translate(0 2.5)">
    {[0, 1].map(i => (
      <g key={i}>
        {line(M, 5 + i * 10, 11, 0.4)}
        {box(M, 7.5 + i * 10, 28, 6, 1.8, 0.5)}
      </g>
    ))}
    {line(38, 5, 13, 0.4)}
    {box(38, 7.5, 29, 6, 1.8, 0.5)}
    {box(38, 18, 3, 3, 0.8, 0.5)}
    {line(43, 19.5, 20, 0.4)}
    {solid(38, 23, 18, 5, 2.5)}
  </g>) },
  cta: { name: "CTA banner", group: "Interactive", h: 22, el: G(22, <g transform="translate(0 2)">
    {soft(M, 2, W, 14, 2.5, 0.12)}
    {line(M + 4, 7, 30, 0.85, 2.2)}
    {line(M + 4, 12, 24, 0.4)}
    {solid(47, 6, 18, 6, 3)}
  </g>) },
  accordion: { name: "Accordion", group: "Interactive", h: 29, el: G(29, <g transform="translate(0 2.5)">
    {box(M, 3, W, 6.5, 1.8, 0.55)}
    {line(M + 2.5, 6.2, 24, 0.65)}
    {chevD(63, 5.6, 1.5, 0.75)}
    {para(M + 2.5, 13, 46, 2, 3, 0.4)}
    {box(M, 19, W, 4.5, 1.8, 0.35)}
    {line(M + 2.5, 21.2, 20, 0.4)}
  </g>) },
  steps: { name: "Process steps", group: "Interactive", h: 22, el: G(22, <g transform="translate(0 2)">
    <line x1="12" y1="7" x2="60" y2="7" opacity="0.25" />
    {[0, 1, 2, 3].map(i => {
      const cx = 12 + i * 16;
      return (
        <g key={i}>
          {i === 0 ? dot(cx, 7, 3, 0.9) : <circle cx={cx} cy="7" r="3" fill="none" opacity="0.45" />}
          {line(cx - 5.5, 13, 11, 0.4)}
          {line(cx - 3.5, 16, 7, 0.28)}
        </g>
      );
    })}
  </g>) },
  toggle: { name: "Toggle / compare", group: "Interactive", h: 15, el: G(15, <g transform="translate(0 1.5)">
    {line(M, 6, 13, 0.4)}
    {box(25, 2.5, 21, 7, 3.5, 0.5)}
    {solid(26, 3.5, 9, 5, 2.5)}
    {line(50, 6, 17, 0.4)}
  </g>) },

  /* ---------------- Wayfinding ---------------- */
  links: { name: "Link list", group: "Wayfinding", h: 27, el: G(27, <g transform="translate(0 2.5)">
    {line(M, 4, 20, 0.8, 1.8)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        {dot(M + 1, 10 + i * 4, 0.9, 0.8)}
        {line(M + 4.5, 10 + i * 4, [42, 50, 34, 45][i], 0.45)}
      </g>
    ))}
  </g>) },
  linker: { name: "Prev / next", group: "Wayfinding", h: 17, el: G(17, <g transform="translate(0 1.5)">
    {box(M, 3, 28, 8, 2, 0.42)}
    {chevL(8.5, 7, 1.6, 0.6)}
    {line(13, 5.5, 7, 0.35)}{line(13, 8.5, 15, 0.5)}
    {box(39, 3, 28, 8, 2, 0.42)}
    {line(43, 5.5, 7, 0.35)}{line(43, 8.5, 15, 0.5)}
    {chevR(63.5, 7, 1.6, 0.6)}
  </g>) },
  map: { name: "Map / locations", group: "Wayfinding", h: 32, el: G(32, <g transform="translate(0 2)">
    {box(M, 3, 38, 22, 2, 0.42)}
    <g opacity="0.28">
      <path d="M5 13 L18 8 L30 15 L43 9" /><path d="M5 20 L16 17 L28 23 L43 18" />
    </g>
    <path d="M23 9c2.3 0 4 1.8 4 3.9 0 2.3-4 5.6-4 5.6s-4-3.3-4-5.6c0-2.1 1.7-3.9 4-3.9z"
          fill="currentColor" stroke="none" opacity="0.9" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        {line(47, 5 + i * 7.5, 14, 0.6)}
        {line(47, 8.5 + i * 7.5, 19, 0.35)}
      </g>
    ))}
  </g>) },
  contact: { name: "Contact details", group: "Wayfinding", h: 26, el: G(26, <g transform="translate(0 2)">
    {box(M, 3, 24, 16, 2, 0.45)}
    {box(M + 3.5, 7, 17, 10, 1.2, 0.5)}
    <path d="M8.5 7.5l8.5 5.6 8.5-5.6" opacity="0.5" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        {dot(35, 6 + i * 5.5, 1.3, 0.8)}
        {line(38.5, 6 + i * 5.5, [26, 20, 24][i], 0.45)}
      </g>
    ))}
  </g>) },
  stats: { name: "Statistics", group: "Wayfinding", h: 26, el: G(26, <g transform="translate(0 2)">
    {[0, 1, 2, 3].map(i => {
      const c = cols(4, 3);
      return (
        <g key={i}>
          {line(c.x(i), 7, c.w * 0.78, 0.95, 3.2)}
          {line(c.x(i), 13, c.w, 0.4)}
          {line(c.x(i), 16.5, c.w * 0.65, 0.3)}
        </g>
      );
    })}
    {line(M, 20.5, W, 0.22)}
  </g>) },
};

export function Glyph({ id }: { id: GlyphId }) {
  return <>{(GLYPHS[id] ?? GLYPHS.textrows).el}</>;
}

/** A block's wireframe: its elements stacked in order, filling the width. */
export function Wireframe({ ids, gap = 3 }: { ids: GlyphId[]; gap?: number; accent?: string }) {
  const list = ids?.length ? ids : (["textrows"] as GlyphId[]);
  return (
    <div className="flex flex-col w-full" style={{ gap }}>
      {list.map((id, i) => <Glyph key={`${id}-${i}`} id={id} />)}
    </div>
  );
}
