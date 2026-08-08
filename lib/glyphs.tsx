import React from "react";
import type { GlyphId } from "./model";

/* Wireframe glyphs on a 72x28 canvas.
 *
 * Two-tone by design: soft filled surfaces carry the shape so a block reads at
 * a glance, thin strokes carry the detail. Everything is currentColor, so a
 * glyph inherits the block's intent colour and stays legible on any of them.
 * Keep new glyphs inside x:4..68 and y:4..24 so a stack of blocks aligns.
 *
 * Sizing: a glyph fills the width it is given and takes its height from the
 * 72:28 ratio, so it reads as the section it stands for rather than as an
 * icon floating in the middle of the block. It used to be pinned to 28px
 * tall, which letterboxed the drawing at natural size inside a much wider
 * box. Callers that need a shorter glyph pass `ratio`. */

const G = (children: React.ReactNode) => (
  // No height attribute: with a viewBox and width:100%, the SVG takes its
  // intrinsic 72:28 ratio and the drawing fills the element edge to edge.
  <svg viewBox="0 0 72 28" width="100%" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" aria-hidden="true"
       style={{ display: "block", height: "auto" }}>
    {children}
  </svg>
);

/** Soft filled surface: the "paper" a section sits on. */
const S = (x: number, y: number, w: number, h: number, r = 2, o = 0.14) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" stroke="none" opacity={o} />
);
/** Solid mark: buttons, avatars, emphasis. */
const F = (x: number, y: number, w: number, h: number, r = 1.5, o = 0.55) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" stroke="none" opacity={o} />
);
/** Text line. */
const L = (x1: number, y: number, x2: number, o = 0.75, w = 1.5) => (
  <line x1={x1} y1={y} x2={x2} y2={y} opacity={o} strokeWidth={w} />
);
const dot = (cx: number, cy: number, r: number, o = 0.6) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" opacity={o} />
);

type Group = "Structure" | "Text" | "Media" | "Collections" | "Interactive" | "Wayfinding";
type Entry = { name: string; group: Group; el: React.ReactNode };

export const GLYPH_GROUPS: Group[] = ["Structure", "Text", "Media", "Collections", "Interactive", "Wayfinding"];

export const GLYPHS: Record<GlyphId, Entry> = {
  /* ---------------- Structure ---------------- */
  hero: { name: "Hero", group: "Structure", el: G(<>
    {S(4, 4, 64, 20, 2.5)}
    {L(10, 11, 44, 0.85, 2.2)}{L(10, 16, 36, 0.55)}
    {F(10, 19.5, 15, 4.5, 2.25)}
  </>) },
  herosplit: { name: "Hero, split", group: "Structure", el: G(<>
    {S(4, 4, 32, 20, 2.5)}
    {L(8, 10, 30, 0.85, 2.2)}{L(8, 14.5, 25, 0.55)}{F(8, 18, 13, 4.5, 2.25)}
    {S(39, 4, 29, 20, 2.5, 0.22)}
    <path d="M43 20l6-5 4 3 5-4 6 6" opacity="0.5" />{dot(48, 10, 1.8, 0.5)}
  </>) },
  banner: { name: "Notice bar", group: "Structure", el: G(<>
    {S(4, 9, 64, 10, 3)}
    {dot(11, 14, 2, 0.55)}{L(17, 14, 52, 0.6)}
    <path d="M60 11.5l4 5M64 11.5l-4 5" opacity="0.45" strokeWidth="1.3" />
  </>) },
  tabs: { name: "Tabs", group: "Structure", el: G(<>
    {F(5, 5, 17, 6, 1.8, 0.5)}
    <rect x="24" y="5" width="17" height="6" rx="1.8" opacity="0.5" />
    <rect x="43" y="5" width="17" height="6" rx="1.8" opacity="0.5" />
    {S(4, 13, 64, 11, 2)}{L(9, 17, 45, 0.55)}{L(9, 21, 34, 0.4)}
  </>) },
  sidebar: { name: "Content + sidebar", group: "Structure", el: G(<>
    {S(4, 4, 20, 20, 2)}
    {L(8, 9, 20, 0.5)}{L(8, 13, 18, 0.4)}{L(8, 17, 20, 0.4)}
    {S(28, 4, 40, 20, 2, 0.2)}
    {L(33, 10, 62, 0.7, 2)}{L(33, 15, 58, 0.5)}{L(33, 19, 50, 0.5)}
  </>) },
  breadcrumb: { name: "Breadcrumb", group: "Structure", el: G(<>
    {F(5, 11, 12, 6, 3, 0.35)}<path d="M20 11.5l3 2.5-3 2.5" opacity="0.5" strokeWidth="1.3" />
    {F(26, 11, 14, 6, 3, 0.35)}<path d="M43 11.5l3 2.5-3 2.5" opacity="0.5" strokeWidth="1.3" />
    {F(49, 11, 18, 6, 3, 0.6)}
  </>) },
  footercols: { name: "Footer columns", group: "Structure", el: G(<>
    {[5, 21, 37, 53].map(x => (
      <g key={x}>{L(x, 8, x + 11, 0.7, 2)}{L(x, 13, x + 9, 0.4)}{L(x, 17, x + 11, 0.4)}{L(x, 21, x + 7, 0.4)}</g>
    ))}
  </>) },

  /* ---------------- Text ---------------- */
  textrows: { name: "Text rows", group: "Text", el: G(<>
    {L(5, 8, 67, 0.7)}{L(5, 14, 58, 0.7)}{L(5, 20, 63, 0.7)}
  </>) },
  text2col: { name: "Two column text", group: "Text", el: G(<>
    {L(5, 8, 32, 0.7)}{L(5, 14, 30, 0.7)}{L(5, 20, 32, 0.7)}
    {L(40, 8, 67, 0.7)}{L(40, 14, 64, 0.7)}{L(40, 20, 67, 0.7)}
  </>) },
  article: { name: "Article", group: "Text", el: G(<>
    {L(5, 7, 40, 0.9, 2.6)}
    {L(5, 13, 67, 0.55)}{L(5, 17.5, 63, 0.55)}{L(5, 22, 52, 0.55)}
  </>) },
  quote: { name: "Quote", group: "Text", el: G(<>
    <path d="M13 8c-3.4 1.1-5 3.4-5 6.6h5.4v6H6.6v-6C6.6 11 8.8 8.6 13 7z" fill="currentColor" stroke="none" opacity="0.45" />
    {L(22, 11, 67, 0.65)}{L(22, 17, 58, 0.65)}{L(22, 22, 44, 0.45)}
  </>) },
  testimonial: { name: "Testimonial", group: "Text", el: G(<>
    {S(4, 4, 64, 20, 2.5)}
    {dot(14, 13, 4.2, 0.5)}
    {L(23, 10, 60, 0.6)}{L(23, 15, 52, 0.45)}
    {L(23, 20, 36, 0.35)}
  </>) },

  /* ---------------- Media ---------------- */
  image: { name: "Image", group: "Media", el: G(<>
    {S(12, 4, 48, 20, 2.5, 0.2)}
    {dot(23, 11, 2.6, 0.5)}
    <path d="M17 21l9.5-7.5 6.5 5 6.5-4.5 15 7" opacity="0.6" />
  </>) },
  video: { name: "Video", group: "Media", el: G(<>
    {S(12, 4, 48, 20, 2.5, 0.2)}
    <path d="M33 9.2l9.5 4.8-9.5 4.8z" fill="currentColor" stroke="none" opacity="0.6" />
  </>) },
  gallery: { name: "Gallery", group: "Media", el: G(<>
    {S(5, 5, 18, 18, 2)}{S(26, 5, 18, 8, 1.8, 0.2)}{S(26, 15, 18, 8, 1.8, 0.2)}
    {S(47, 5, 20, 18, 2, 0.2)}
    {dot(11, 11, 1.8, 0.45)}
  </>) },
  logos: { name: "Logo strip", group: "Media", el: G(<>
    {dot(10, 14, 4, 0.35)}
    {F(20, 11, 11, 6, 1.5, 0.3)}
    <rect x="35" y="10.5" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" opacity="0.3" />
    {F(46, 11.5, 10, 5, 2.5, 0.3)}
    {dot(63, 14, 3.6, 0.3)}
  </>) },
  split: { name: "Media + text", group: "Media", el: G(<>
    {S(4, 4, 30, 20, 2.5, 0.22)}
    {dot(13, 11, 2.2, 0.5)}<path d="M8 20l7-5.5 5 4 4-3 6 4.5" opacity="0.55" />
    {L(40, 9, 67, 0.8, 2.2)}{L(40, 14.5, 63, 0.5)}{L(40, 19, 55, 0.5)}
  </>) },

  /* ---------------- Collections ---------------- */
  cards3: { name: "Three cards", group: "Collections", el: G(<>
    {[5, 27, 49].map(x => <g key={x}>{S(x, 5, 18, 18, 2.2)}{L(x + 4, 18, x + 14, 0.45)}</g>)}
  </>) },
  cards4: { name: "Four cards", group: "Collections", el: G(<>
    {[4, 21, 38, 55].map(x => <g key={x}>{S(x, 6, 13, 16, 2)}{L(x + 3, 18, x + 10, 0.4)}</g>)}
  </>) },
  grid2x2: { name: "Feature grid", group: "Collections", el: G(<>
    {[[10, 4], [38, 4], [10, 15], [38, 15]].map(([x, y]) => (
      <g key={`${x}-${y}`}>{S(x, y, 24, 9, 1.8)}{L(x + 3, y + 4.5, x + 15, 0.4)}</g>
    ))}
  </>) },
  people: { name: "People cards", group: "Collections", el: G(<>
    {[5, 27, 49].map(x => (
      <g key={x}>{S(x, 4, 18, 20, 2.2)}{dot(x + 9, 11, 3.4, 0.5)}{L(x + 4, 19, x + 14, 0.45)}</g>
    ))}
  </>) },
  carousel: { name: "Carousel", group: "Collections", el: G(<>
    <path d="M7 10.5l-3.2 3.5 3.2 3.5" opacity="0.45" strokeWidth="1.3" />
    {S(12, 5, 22, 18, 2.2)}{S(38, 5, 22, 18, 2.2, 0.2)}
    <path d="M65 10.5l3.2 3.5-3.2 3.5" opacity="0.45" strokeWidth="1.3" />
  </>) },
  related: { name: "Related content", group: "Collections", el: G(<>
    {[5, 27, 49].map(x => (
      <g key={x}>{S(x, 4, 18, 11, 2, 0.22)}{L(x + 2, 19, x + 15, 0.55)}{L(x + 2, 22.5, x + 10, 0.35)}</g>
    ))}
  </>) },
  listrows: { name: "Listing rows", group: "Collections", el: G(<>
    {[4, 12.5, 21].map(y => (
      <g key={y}>{S(4, y, 64, 6.5, 1.8, 0.11)}{F(6.5, y + 1.5, 3.5, 3.5, 1, 0.4)}
        {L(13, y + 2.6, 42, 0.55)}{L(13, y + 4.8, 30, 0.3)}</g>
    ))}
  </>) },
  table: { name: "Table", group: "Collections", el: G(<>
    {F(4, 4, 64, 6, 1.8, 0.28)}
    {S(4, 11, 64, 6, 1.5, 0.1)}{S(4, 18, 64, 6, 1.5, 0.1)}
    <g opacity="0.35"><line x1="25" y1="4" x2="25" y2="24" /><line x1="46" y1="4" x2="46" y2="24" /></g>
  </>) },
  pricing: { name: "Pricing", group: "Collections", el: G(<>
    {S(5, 7, 18, 16, 2)}{L(8, 12, 18, 0.45)}
    {S(27, 4, 18, 20, 2, 0.26)}{L(30, 10, 40, 0.6)}{F(30, 18, 12, 3.5, 1.75, 0.5)}
    {S(49, 7, 18, 16, 2)}{L(52, 12, 62, 0.45)}
  </>) },

  /* ---------------- Interactive ---------------- */
  search: { name: "Search", group: "Interactive", el: G(<>
    {S(6, 8, 50, 12, 6, 0.16)}
    {L(12, 14, 34, 0.4)}
    <circle cx="61" cy="13" r="4.2" opacity="0.7" /><line x1="64.2" y1="16.2" x2="67" y2="19" opacity="0.7" />
  </>) },
  filters: { name: "Filters + results", group: "Interactive", el: G(<>
    {[6, 12, 18].map(y => <g key={y}><rect x="5" y={y} width="4.5" height="4.5" rx="1" opacity="0.55" />{L(12, y + 2.3, 24, 0.4)}</g>)}
    {S(31, 4, 37, 9, 2, 0.16)}{S(31, 15, 37, 9, 2, 0.16)}
  </>) },
  form: { name: "Form / sign-up", group: "Interactive", el: G(<>
    {L(5, 6, 24, 0.45)}
    {S(5, 9, 34, 7, 2)}{S(5, 18, 34, 7, 2)}
    {L(45, 9, 67, 0.45)}{L(45, 14, 60, 0.35)}
    {F(45, 18, 18, 6.5, 3.25, 0.55)}
  </>) },
  cta: { name: "CTA banner", group: "Interactive", el: G(<>
    {S(4, 6, 64, 16, 2.5, 0.12)}
    {L(10, 12, 40, 0.7, 2)}{L(10, 17, 32, 0.4)}
    {F(46, 10.5, 18, 7, 3.5, 0.55)}
  </>) },
  accordion: { name: "Accordion", group: "Interactive", el: G(<>
    {S(5, 4, 62, 6.5, 1.8, 0.2)}<path d="M60 6.4l2 2 2-2" opacity="0.6" strokeWidth="1.3" />
    {S(5, 12, 62, 5, 1.8, 0.1)}
    {S(5, 19, 62, 5, 1.8, 0.1)}
  </>) },
  steps: { name: "Process steps", group: "Interactive", el: G(<>
    <line x1="12" y1="12" x2="60" y2="12" opacity="0.3" />
    {[12, 36, 60].map((cx, i) => (
      <g key={cx}>{dot(cx, 12, 4.2, i === 0 ? 0.6 : 0.3)}{L(cx - 7, 21, cx + 7, 0.4)}</g>
    ))}
  </>) },
  toggle: { name: "Toggle / compare", group: "Interactive", el: G(<>
    {S(20, 8, 32, 12, 6, 0.18)}{dot(27, 14, 4, 0.6)}
    {L(6, 14, 15, 0.45)}{L(57, 14, 66, 0.45)}
  </>) },

  /* ---------------- Wayfinding ---------------- */
  links: { name: "Link list", group: "Wayfinding", el: G(<>
    {[8, 14, 20].map((y, i) => <g key={y}>{dot(8, y, 1.5, 0.55)}{L(14, y, [46, 52, 42][i], 0.6)}</g>)}
  </>) },
  linker: { name: "Prev / next", group: "Wayfinding", el: G(<>
    {S(4, 8, 28, 12, 2, 0.12)}<path d="M13 11l-3.5 3 3.5 3" opacity="0.6" strokeWidth="1.3" />{L(18, 14, 28, 0.4)}
    {S(40, 8, 28, 12, 2, 0.12)}{L(44, 14, 54, 0.4)}<path d="M59 11l3.5 3-3.5 3" opacity="0.6" strokeWidth="1.3" />
  </>) },
  map: { name: "Map / locations", group: "Wayfinding", el: G(<>
    {S(12, 4, 48, 20, 2.5, 0.18)}
    <path d="M36 8.5c3.2 0 5.4 2.4 5.4 5.2 0 3.2-5.4 7.6-5.4 7.6s-5.4-4.4-5.4-7.6c0-2.8 2.2-5.2 5.4-5.2z"
          fill="currentColor" stroke="none" opacity="0.5" />
    <circle cx="36" cy="13.4" r="1.7" fill="var(--card, #fff)" stroke="none" opacity="0.9" />
  </>) },
  contact: { name: "Contact details", group: "Wayfinding", el: G(<>
    {S(8, 7, 20, 14, 2, 0.2)}<path d="M10 9.5l8 5.5 8-5.5" opacity="0.55" />
    {L(34, 10, 64, 0.5)}{L(34, 15, 56, 0.4)}{L(34, 20, 60, 0.4)}
  </>) },
  stats: { name: "Statistics", group: "Wayfinding", el: G(<>
    {[[12, 12], [24, 7], [36, 15], [48, 9], [60, 13]].map(([x, y]) => (
      <rect key={x} x={x - 3} y={y} width="6" height={22 - y} rx="1.5" fill="currentColor" stroke="none"
            opacity={y === 7 ? 0.55 : 0.3} />
    ))}
    <line x1="5" y1="22.5" x2="67" y2="22.5" opacity="0.4" />
  </>) },
};

export function Glyph({ id }: { id: GlyphId }) {
  return <>{(GLYPHS[id] ?? GLYPHS.textrows).el}</>;
}

/** A block's wireframe: its glyphs stacked in order, filling the width they
 *  are given. `gap` is the space between elements in the same block. */
export function Wireframe({ ids, gap = 3 }: { ids: GlyphId[]; gap?: number }) {
  const list = ids?.length ? ids : (["textrows"] as GlyphId[]);
  return (
    <div className="flex flex-col w-full" style={{ gap }}>
      {list.map((id, i) => <Glyph key={`${id}-${i}`} id={id} />)}
    </div>
  );
}
