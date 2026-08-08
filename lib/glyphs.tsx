import React from "react";
import type { GlyphId } from "./model";

/* Wireframe elements.
 *
 * Three rules make these read as a designed wireframe rather than icons:
 *
 * 1. **Every element declares its own height.** A notice bar is 12 units
 *    tall and a hero is 46 on the same 72-wide canvas, so a stack of them
 *    has the rhythm of a real page instead of a row of equal-sized icons.
 * 2. **They are drawn on paper.** Each element paints its own panel in
 *    --wire-paper and sits inside the block's colour, so the colour reads as
 *    the block's intent tag and the drawing reads as the layout.
 * 3. **Weight carries meaning.** Headlines are heavy and short, body text is
 *    light and long, surfaces are faint, and anything a visitor acts on is
 *    painted in --wire-accent (the block's own intent colour). Nothing is a
 *    uniform grey scribble.
 *
 * Canvas is 72 wide with a 5-unit margin, so content lives in x:5..67. */

const M = 5;              // side margin
const W = 72 - M * 2;     // content width, 62

const G = (h: number, children: React.ReactNode) => (
  // No height attribute: with a viewBox and width 100%, the element takes its
  // intrinsic ratio and the drawing fills it edge to edge.
  <svg viewBox={`0 0 72 ${h}`} width="100%" fill="none" aria-hidden="true"
       style={{ display: "block", height: "auto" }}>
    <rect x="0" y="0" width="72" height={h} rx="3" fill="var(--wire-paper)" />
    <rect x="0.4" y="0.4" width="71.2" height={h - 0.8} rx="2.8" fill="none" stroke="var(--wire-edge)" strokeWidth="0.8" />
    {children}
  </svg>
);

/* ---------- primitives ---------- */

/** Faint surface: the area a sub-element occupies. */
const surface = (x: number, y: number, w: number, h: number, r = 2, fill = "var(--wire-soft)") => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
);
/** Outlined surface: a card or panel with an edge rather than a fill. */
const card = (x: number, y: number, w: number, h: number, r = 2) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill="var(--wire-faint)" />
    <rect x={x + 0.3} y={y + 0.3} width={w - 0.6} height={h - 0.6} rx={r} fill="none" stroke="var(--wire-edge)" strokeWidth="0.7" />
  </g>
);
/** Headline: short and heavy. */
const head = (x: number, y: number, w: number, h = 2.6) => (
  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="var(--wire-strong)" />
);
/** Body copy: long and light. */
const text = (x: number, y: number, w: number, h = 1.5) => (
  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="var(--wire-mid)" />
);
/** A run of body lines, last one short like real ragged text. */
const para = (x: number, y: number, w: number, rows: number, gap = 3.4) => (
  <g>{Array.from({ length: rows }, (_, i) => (
    <rect key={i} x={x} y={y + i * gap} width={i === rows - 1 ? w * 0.62 : w} height="1.5" rx="0.75" fill="var(--wire-mid)" />
  ))}</g>
);
/** Something a visitor acts on: painted in the block's intent colour. */
const action = (x: number, y: number, w: number, h: number, r = 99) => (
  <rect x={x} y={y} width={w} height={h} rx={r === 99 ? h / 2 : r} fill="var(--wire-accent, var(--wire-strong))" />
);
/** Image placeholder: a real picture mark, not a grey box. */
const img = (x: number, y: number, w: number, h: number, r = 2) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill="var(--wire-soft)" />
    <circle cx={x + w * 0.28} cy={y + h * 0.32} r={Math.min(w, h) * 0.09} fill="var(--wire-mid)" />
    <path d={`M${x + w * 0.08} ${y + h * 0.86} L${x + w * 0.36} ${y + h * 0.48} L${x + w * 0.56} ${y + h * 0.68} L${x + w * 0.72} ${y + h * 0.55} L${x + w * 0.94} ${y + h * 0.86} Z`}
          fill="var(--wire-mid)" opacity="0.85" />
  </g>
);
const avatar = (cx: number, cy: number, r: number) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="var(--wire-soft)" />
    <circle cx={cx} cy={cy - r * 0.28} r={r * 0.36} fill="var(--wire-mid)" />
    <path d={`M${cx - r * 0.62} ${cy + r * 0.78} a${r * 0.62} ${r * 0.55} 0 0 1 ${r * 1.24} 0 Z`} fill="var(--wire-mid)" />
  </g>
);
const icon = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} fill="var(--wire-mid)" />;
const rule = (y: number, x1 = M, x2 = 72 - M) => (
  <rect x={x1} y={y} width={x2 - x1} height="0.6" fill="var(--wire-edge)" />
);

type Group = "Structure" | "Text" | "Media" | "Collections" | "Interactive" | "Wayfinding";
type Entry = { name: string; group: Group; h: number; el: React.ReactNode };

export const GLYPH_GROUPS: Group[] = ["Structure", "Text", "Media", "Collections", "Interactive", "Wayfinding"];

/** Column x positions for an n-across grid inside the content width. */
const cols = (n: number, gap = 2.5) => {
  const w = (W - gap * (n - 1)) / n;
  return { w, x: (i: number) => M + i * (w + gap) };
};

export const GLYPHS: Record<GlyphId, Entry> = {
  /* ---------------- Structure ---------------- */
  hero: { name: "Hero", group: "Structure", h: 46, el: G(46, <>
    {surface(0, 0, 72, 46, 3, "var(--wire-faint)")}
    {head(M, 12, 40, 3.4)}{head(M, 17.5, 28, 3.4)}
    {para(M, 25, 44, 2)}
    {action(M, 34, 20, 6)}
    <rect x={M + 23} y="34" width="16" height="6" rx="3" fill="none" stroke="var(--wire-mid)" strokeWidth="0.8" />
  </>) },
  herosplit: { name: "Hero, split", group: "Structure", h: 46, el: G(46, <>
    {head(M, 12, 28, 3.4)}{head(M, 17.5, 20, 3.4)}
    {para(M, 25, 30, 2)}
    {action(M, 34, 18, 6)}
    {img(40, 7, 27, 32, 2.5)}
  </>) },
  banner: { name: "Notice bar", group: "Structure", h: 12, el: G(12, <>
    {surface(0, 0, 72, 12, 3, "var(--wire-faint)")}
    {icon(M + 3, 6, 2.2)}
    {text(M + 8, 5.2, 38)}
    <path d="M63 4.2l3.6 3.6M66.6 4.2l-3.6 3.6" stroke="var(--wire-mid)" strokeWidth="1" strokeLinecap="round" />
  </>) },
  tabs: { name: "Tabs", group: "Structure", h: 34, el: G(34, <>
    {action(M, 5, 16, 5, 2)}
    <rect x={M + 18} y="5" width="16" height="5" rx="2" fill="var(--wire-soft)" />
    <rect x={M + 36} y="5" width="16" height="5" rx="2" fill="var(--wire-soft)" />
    {rule(11.5)}
    {head(M, 16, 26)}{para(M, 22, W, 3)}
  </>) },
  sidebar: { name: "Content + sidebar", group: "Structure", h: 42, el: G(42, <>
    {card(M, 6, 18, 30)}
    {text(M + 3, 11, 12)}{text(M + 3, 16, 10)}{text(M + 3, 21, 12)}{text(M + 3, 26, 9)}
    {head(27, 8, 30)}{para(27, 15, 40, 5)}
  </>) },
  breadcrumb: { name: "Breadcrumb", group: "Structure", h: 10, el: G(10, <>
    {text(M, 4.2, 10)}
    <path d="M18 3.4l1.8 1.6-1.8 1.6" stroke="var(--wire-edge)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
    {text(22, 4.2, 12)}
    <path d="M37 3.4l1.8 1.6-1.8 1.6" stroke="var(--wire-edge)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
    {head(41, 3.7, 16, 2.2)}
  </>) },
  footercols: { name: "Footer columns", group: "Structure", h: 34, el: G(34, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4, 3);
      return (
        <g key={i}>
          {head(c.x(i), 7, c.w * 0.72, 2)}
          {text(c.x(i), 13, c.w * 0.9)}{text(c.x(i), 17.5, c.w * 0.7)}{text(c.x(i), 22, c.w * 0.85)}
        </g>
      );
    })}
    {rule(28)}
    {text(M, 30, 24)}
  </>) },

  /* ---------------- Text ---------------- */
  textrows: { name: "Text rows", group: "Text", h: 24, el: G(24, <>
    {para(M, 6, W, 5)}
  </>) },
  text2col: { name: "Two column text", group: "Text", h: 28, el: G(28, <>
    {para(M, 7, 28, 5)}
    {para(39, 7, 28, 5)}
  </>) },
  article: { name: "Article", group: "Text", h: 38, el: G(38, <>
    {head(M, 6, 42, 3.2)}
    {text(M, 13, 24)}
    {rule(18)}
    {para(M, 22, W, 4)}
  </>) },
  quote: { name: "Quote", group: "Text", h: 28, el: G(28, <>
    <path d="M9 8c-2.6.9-4 2.7-4 5.3h4.2v4.6H4.1v-4.6C4.1 10 5.9 8 9 7z" fill="var(--wire-accent, var(--wire-mid))" opacity="0.5" />
    {head(16, 9, 40, 2.4)}{head(16, 14, 32, 2.4)}
    {text(16, 20, 20)}
  </>) },
  testimonial: { name: "Testimonial", group: "Text", h: 32, el: G(32, <>
    {card(M, 5, W, 22)}
    {avatar(14, 14, 4.4)}
    {para(22, 10, 40, 3)}
    {text(22, 22, 16)}
  </>) },

  /* ---------------- Media ---------------- */
  image: { name: "Image", group: "Media", h: 40, el: G(40, <>
    {img(M, 5, W, 26, 2.5)}
    {text(M, 34, 30)}
  </>) },
  video: { name: "Video", group: "Media", h: 40, el: G(40, <>
    {surface(M, 5, W, 30, 2.5)}
    <circle cx="36" cy="20" r="6" fill="var(--wire-accent, var(--wire-mid))" opacity="0.85" />
    <path d="M34.2 16.8l4.6 3.2-4.6 3.2z" fill="var(--wire-paper)" />
  </>) },
  gallery: { name: "Gallery", group: "Media", h: 36, el: G(36, <>
    {img(M, 5, 30, 26, 2.5)}
    {img(38, 5, 29, 12, 2.5)}
    {img(38, 19, 29, 12, 2.5)}
  </>) },
  logos: { name: "Logo strip", group: "Media", h: 16, el: G(16, <>
    {text(M, 3, 20)}
    {[0, 1, 2, 3, 4].map(i => {
      const c = cols(5, 3);
      return <rect key={i} x={c.x(i)} y="8" width={c.w} height="5" rx="1.5" fill="var(--wire-soft)" />;
    })}
  </>) },
  split: { name: "Media + text", group: "Media", h: 38, el: G(38, <>
    {img(M, 5, 28, 28, 2.5)}
    {head(38, 8, 26, 3)}
    {para(38, 15, 28, 3)}
    {action(38, 26, 16, 5.5)}
  </>) },

  /* ---------------- Collections ---------------- */
  cards3: { name: "Three cards", group: "Collections", h: 38, el: G(38, <>
    {head(M, 5, 26, 2.6)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {card(c.x(i), 11, c.w, 22)}
          {img(c.x(i) + 1.5, 12.5, c.w - 3, 9, 1.5)}
          {text(c.x(i) + 1.5, 24, c.w - 6)}{text(c.x(i) + 1.5, 27.5, c.w - 10)}
        </g>
      );
    })}
  </>) },
  cards4: { name: "Four cards", group: "Collections", h: 34, el: G(34, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4);
      return (
        <g key={i}>
          {card(c.x(i), 5, c.w, 24)}
          {img(c.x(i) + 1.2, 6.2, c.w - 2.4, 10, 1.5)}
          {text(c.x(i) + 1.2, 19, c.w - 4)}{text(c.x(i) + 1.2, 22.5, c.w - 7)}
        </g>
      );
    })}
  </>) },
  grid2x2: { name: "Feature grid", group: "Collections", h: 36, el: G(36, <>
    {[0, 1].map(r => [0, 1].map(i => {
      const c = cols(2, 3);
      const y = 5 + r * 14.5;
      return (
        <g key={`${r}-${i}`}>
          {card(c.x(i), y, c.w, 12.5)}
          {icon(c.x(i) + 4.5, y + 4.5, 2.2)}
          {text(c.x(i) + 9, y + 3.6, c.w - 13)}{text(c.x(i) + 9, y + 7.4, c.w - 18)}
        </g>
      );
    }))}
  </>) },
  people: { name: "People cards", group: "Collections", h: 40, el: G(40, <>
    {head(M, 5, 24, 2.6)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {card(c.x(i), 11, c.w, 24)}
          {avatar(c.x(i) + c.w / 2, 19, 4.6)}
          {text(c.x(i) + 2.5, 27, c.w - 5)}{text(c.x(i) + 4.5, 30.5, c.w - 9)}
        </g>
      );
    })}
  </>) },
  carousel: { name: "Carousel", group: "Collections", h: 36, el: G(36, <>
    <circle cx="5.5" cy="18" r="3.4" fill="var(--wire-soft)" />
    <path d="M6.6 16.3l-1.7 1.7 1.7 1.7" stroke="var(--wire-mid)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    {card(11, 5, 24, 22)}{img(12.5, 6.5, 21, 12, 1.5)}{text(12.5, 21, 16)}
    {card(37, 5, 24, 22)}{img(38.5, 6.5, 21, 12, 1.5)}{text(38.5, 21, 16)}
    <circle cx="66.5" cy="18" r="3.4" fill="var(--wire-soft)" />
    <path d="M65.4 16.3l1.7 1.7-1.7 1.7" stroke="var(--wire-mid)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    <g>{[0, 1, 2].map(i => <circle key={i} cx={33 + i * 3.2} cy="31.5" r="1" fill={i === 0 ? "var(--wire-accent, var(--wire-strong))" : "var(--wire-soft)"} />)}</g>
  </>) },
  related: { name: "Related content", group: "Collections", h: 36, el: G(36, <>
    {head(M, 5, 22, 2.4)}
    {[0, 1, 2].map(i => {
      const c = cols(3);
      return (
        <g key={i}>
          {img(c.x(i), 11, c.w, 11, 2)}
          {text(c.x(i), 24.5, c.w * 0.9)}{text(c.x(i), 28.5, c.w * 0.6)}
        </g>
      );
    })}
  </>) },
  listrows: { name: "Listing rows", group: "Collections", h: 38, el: G(38, <>
    {[0, 1, 2].map(i => {
      const y = 5 + i * 10.5;
      return (
        <g key={i}>
          {card(M, y, W, 9)}
          {img(M + 1.5, y + 1.2, 9, 6.6, 1.2)}
          {head(M + 13, y + 2, 24, 2)}
          {text(M + 13, y + 5.6, 32)}
          {action(56, y + 2.6, 9, 3.8)}
        </g>
      );
    })}
  </>) },
  table: { name: "Table", group: "Collections", h: 32, el: G(32, <>
    <rect x={M} y="5" width={W} height="6" rx="1.5" fill="var(--wire-soft)" />
    {[0, 1, 2].map(i => <rect key={i} x={M + 2 + i * 20} y="7.2" width="13" height="1.6" rx="0.8" fill="var(--wire-strong)" />)}
    {[0, 1, 2].map(r => (
      <g key={r}>
        {rule(12 + r * 6.5, M, 72 - M)}
        {[0, 1, 2].map(i => <rect key={i} x={M + 2 + i * 20} y={14 + r * 6.5} width={i === 0 ? 15 : 11} height="1.5" rx="0.75" fill="var(--wire-mid)" />)}
      </g>
    ))}
    {rule(31.5, M, 72 - M)}
  </>) },
  pricing: { name: "Pricing", group: "Collections", h: 42, el: G(42, <>
    {[0, 1, 2].map(i => {
      const c = cols(3);
      const mid = i === 1;
      const y = mid ? 4 : 7;
      const h = mid ? 32 : 26;
      return (
        <g key={i}>
          {card(c.x(i), y, c.w, h, 2.5)}
          {text(c.x(i) + 3, y + 3.5, c.w - 10)}
          {head(c.x(i) + 3, y + 8, c.w - 8, 3.4)}
          {text(c.x(i) + 3, y + 15, c.w - 6)}{text(c.x(i) + 3, y + 18.5, c.w - 9)}
          {mid ? action(c.x(i) + 3, y + 24, c.w - 6, 4.5)
               : <rect x={c.x(i) + 3} y={y + 20} width={c.w - 6} height="4" rx="2" fill="none" stroke="var(--wire-mid)" strokeWidth="0.8" />}
        </g>
      );
    })}
  </>) },

  /* ---------------- Interactive ---------------- */
  search: { name: "Search", group: "Interactive", h: 16, el: G(16, <>
    <rect x={M} y="4" width="50" height="8" rx="4" fill="var(--wire-soft)" />
    <circle cx="11" cy="8" r="2.2" fill="none" stroke="var(--wire-mid)" strokeWidth="0.9" />
    <path d="M12.7 9.7l1.6 1.6" stroke="var(--wire-mid)" strokeWidth="0.9" strokeLinecap="round" />
    {text(17, 7.2, 24)}
    {action(57, 4, 10, 8, 4)}
  </>) },
  filters: { name: "Filters + results", group: "Interactive", h: 40, el: G(40, <>
    {card(M, 5, 18, 30)}
    {text(M + 2.5, 8, 10)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <rect x={M + 2.5} y={13 + i * 5.5} width="3" height="3" rx="0.8" fill={i === 0 ? "var(--wire-accent, var(--wire-strong))" : "var(--wire-soft)"} />
        {text(M + 7.5, 13.7 + i * 5.5, 9)}
      </g>
    ))}
    {[0, 1, 2].map(i => (
      <g key={i}>
        {card(27, 5 + i * 10.4, 40, 9)}
        {head(29, 7.4 + i * 10.4, 20, 2)}
        {text(29, 11 + i * 10.4, 30)}
      </g>
    ))}
  </>) },
  form: { name: "Form / sign-up", group: "Interactive", h: 40, el: G(40, <>
    {head(M, 5, 26, 2.6)}
    {[0, 1].map(i => (
      <g key={i}>
        {text(M, 11 + i * 11, 12)}
        <rect x={M} y={14.5 + i * 11} width="30" height="6.5" rx="2" fill="var(--wire-soft)" />
      </g>
    ))}
    {text(39, 11, 14)}
    <rect x="39" y="14.5" width="28" height="6.5" rx="2" fill="var(--wire-soft)" />
    <rect x="39" y="25.5" width="3" height="3" rx="0.8" fill="var(--wire-soft)" />
    {text(44, 26.2, 22)}
    {action(39, 31, 20, 6)}
  </>) },
  cta: { name: "CTA banner", group: "Interactive", h: 24, el: G(24, <>
    {surface(0, 0, 72, 24, 3, "var(--wire-faint)")}
    {head(M, 7, 32, 3)}
    {text(M, 14, 38)}
    {action(48, 8.5, 19, 7)}
  </>) },
  accordion: { name: "Accordion", group: "Interactive", h: 32, el: G(32, <>
    <rect x={M} y="5" width={W} height="8" rx="2" fill="var(--wire-soft)" />
    {head(M + 2.5, 8, 26, 2.2)}
    <path d="M62 8.4l2 2 2-2" stroke="var(--wire-strong)" strokeWidth="1" fill="none" strokeLinecap="round" />
    {para(M + 2.5, 15.5, 50, 2)}
    {rule(23)}
    <rect x={M} y="25" width={W} height="5" rx="2" fill="var(--wire-faint)" />
    {text(M + 2.5, 27, 22)}
  </>) },
  steps: { name: "Process steps", group: "Interactive", h: 26, el: G(26, <>
    <rect x="12" y="9.4" width="48" height="1.2" fill="var(--wire-soft)" />
    {[0, 1, 2, 3].map(i => {
      const cx = 12 + i * 16;
      return (
        <g key={i}>
          <circle cx={cx} cy="10" r="3.6" fill={i === 0 ? "var(--wire-accent, var(--wire-strong))" : "var(--wire-soft)"} />
          {text(cx - 6, 17, 12)}{text(cx - 4, 20.5, 8)}
        </g>
      );
    })}
  </>) },
  toggle: { name: "Toggle / compare", group: "Interactive", h: 18, el: G(18, <>
    {text(M, 8, 14)}
    <rect x="26" y="5" width="20" height="8" rx="4" fill="var(--wire-soft)" />
    {action(27, 6, 8, 6, 3)}
    {text(50, 8, 17)}
  </>) },

  /* ---------------- Wayfinding ---------------- */
  links: { name: "Link list", group: "Wayfinding", h: 28, el: G(28, <>
    {head(M, 5, 20, 2.2)}
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <circle cx={M + 1.5} cy={12.5 + i * 4.6} r="1" fill="var(--wire-accent, var(--wire-mid))" />
        {text(M + 5, 11.8 + i * 4.6, [42, 50, 36, 46][i])}
      </g>
    ))}
  </>) },
  linker: { name: "Prev / next", group: "Wayfinding", h: 18, el: G(18, <>
    {card(M, 4, 28, 10)}
    <path d="M10.4 7.5l-2 2 2 2" stroke="var(--wire-mid)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    {text(13, 7, 8)}{text(13, 10.5, 16)}
    {card(39, 4, 28, 10)}
    {text(43, 7, 8)}{text(43, 10.5, 16)}
    <path d="M63.6 7.5l2 2-2 2" stroke="var(--wire-mid)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
  </>) },
  map: { name: "Map / locations", group: "Wayfinding", h: 40, el: G(40, <>
    {surface(M, 5, 40, 30, 2.5)}
    <path d="M5 20 L20 14 L32 22 L45 15" stroke="var(--wire-edge)" strokeWidth="1" fill="none" />
    <path d="M5 28 L18 25 L30 31 L45 26" stroke="var(--wire-edge)" strokeWidth="1" fill="none" />
    <path d="M25 15c2.6 0 4.4 2 4.4 4.3 0 2.6-4.4 6.2-4.4 6.2s-4.4-3.6-4.4-6.2c0-2.3 1.8-4.3 4.4-4.3z" fill="var(--wire-accent, var(--wire-strong))" />
    <circle cx="25" cy="19.3" r="1.4" fill="var(--wire-paper)" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        {head(48, 7 + i * 10, 14, 2)}
        {text(48, 11 + i * 10, 19)}{text(48, 14.5 + i * 10, 14)}
      </g>
    ))}
  </>) },
  contact: { name: "Contact details", group: "Wayfinding", h: 30, el: G(30, <>
    {card(M, 5, 26, 20)}
    <rect x={M + 4} y="10" width="18" height="11" rx="1.5" fill="var(--wire-soft)" />
    <path d="M9 10.6l8 5.4 8-5.4" stroke="var(--wire-mid)" strokeWidth="0.9" fill="none" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        <circle cx="37" cy={9 + i * 7} r="1.6" fill="var(--wire-accent, var(--wire-mid))" />
        {text(41, 8.3 + i * 7, [26, 20, 24][i])}
      </g>
    ))}
  </>) },
  stats: { name: "Statistics", group: "Wayfinding", h: 30, el: G(30, <>
    {[0, 1, 2, 3].map(i => {
      const c = cols(4, 3);
      return (
        <g key={i}>
          {head(c.x(i), 8, c.w * 0.8, 4)}
          {text(c.x(i), 15, c.w)}{text(c.x(i), 18.5, c.w * 0.7)}
        </g>
      );
    })}
    {rule(24)}
  </>) },
};

export function Glyph({ id }: { id: GlyphId }) {
  return <>{(GLYPHS[id] ?? GLYPHS.textrows).el}</>;
}

/** A block's wireframe: its elements stacked in order, filling the width.
 *  `accent` paints the interactive marks in the block's own intent colour. */
export function Wireframe({ ids, gap = 3, accent }: { ids: GlyphId[]; gap?: number; accent?: string }) {
  const list = ids?.length ? ids : (["textrows"] as GlyphId[]);
  return (
    <div className="flex flex-col w-full"
         style={{ gap, ...(accent ? ({ "--wire-accent": accent } as React.CSSProperties) : {}) }}>
      {list.map((id, i) => <Glyph key={`${id}-${i}`} id={id} />)}
    </div>
  );
}
