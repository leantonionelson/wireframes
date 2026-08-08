// Octo data model. One Doc per project. Pages form a tree via parentId.
// Blocks stack inside a page in order. Everything is plain JSON so the
// storage layer can later be swapped for a CRDT (Yjs) without a rewrite.

export type ColorRole = "header" | "nav" | "content" | "footer" | "external";

export type GlyphId =
  // Structure
  | "hero" | "herosplit" | "banner" | "tabs" | "sidebar" | "breadcrumb" | "footercols"
  // Text
  | "textrows" | "text2col" | "article" | "quote" | "testimonial"
  // Media
  | "image" | "video" | "gallery" | "logos" | "split"
  // Collections
  | "cards3" | "cards4" | "grid2x2" | "people" | "carousel" | "related"
  | "listrows" | "table" | "pricing"
  // Interactive
  | "search" | "filters" | "form" | "cta" | "accordion" | "steps" | "toggle"
  // Wayfinding
  | "links" | "linker" | "map" | "contact" | "stats";

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: number; // epoch ms
}

export interface Block {
  id: string;
  label: string;
  /** The wireframe elements this block is made of, top to bottom. A block is
   *  often more than one thing (a hero above three cards), so this is a list.
   *  v1 documents carried a single `glyph`; the v2 migration wraps it. */
  glyphs: GlyphId[];
  color: ColorRole;
  note: string;        // markdown-ish free text: purpose, needs, content status
  component: string;   // e.g. "AEM: Promotional Banner"
  flag: string;        // red flag text, empty if none
  comments: Comment[];
  // Persona (intent) ids this block serves, most important first. The first
  // entry drives the block's colour; the rest render as secondary dots.
  // Empty means fall back to the structural `color` role.
  intents?: string[];
}

export interface Page {
  id: string;
  name: string;
  parentId: string | null; // null = root
  order: number;           // sibling sort
  note: string;            // page-level purpose note
  external?: boolean;      // e.g. SuccessFactors card
  blocks: Block[];
}

// A note pinned onto the wireframe itself: anchored to a page card or to a
// specific block within it, at a fractional position inside the anchor's
// rect so it stays put through zoom and tree-layout changes.
export interface PinNote {
  id: string;
  pageId: string;
  blockId?: string;  // when set, anchor is the block; otherwise the page card
  fx: number;        // 0..1 across the anchor's width
  fy: number;        // 0..1 down the anchor's height
  text: string;
  author: string;
  at: number;        // epoch ms
}

// A person working on the project. The roster is shared on the document so
// everyone picks from the same list; which one you are is stored per browser.
// Deliberately not an account: this is attribution, not authentication.
export interface Member {
  id: string;
  name: string;
  color: string;   // hex, cycled from PERSONA_COLORS
  at: number;      // added, epoch ms
}

export interface Persona {
  id: string;
  name: string;
  color: string;   // hex
  desc: string;
}

export interface JourneyStep { pageId: string; note: string }

export interface Journey {
  id: string;
  personaId: string;
  name: string;
  goal: string;   // what the persona is trying to achieve
  entry: string;  // where the journey begins (channel, system)
  exit: string;   // where it ends (destination, hand-off)
  steps: JourneyStep[];
}

export interface Doc {
  id: string;
  name: string;
  // Document shape version; absent means v0 (pre-personas). Bump SCHEMA_VERSION
  // in lib/migrations.ts and add a pure migration for every shape change.
  schemaVersion?: number;
  rev: number;
  updatedAt: number;
  updatedBy: string;
  pages: Page[];
  personas: Persona[];
  journeys: Journey[];
  notes: PinNote[];
  members: Member[];
}

/** Initials for an avatar chip: first letters of the first two words. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PERSONA_COLORS = ["#8b5cf6", "#f59e0b", "#0ea5e9", "#10b981", "#ef4444", "#ec4899"];

// Boundary normalisation is the migration chain; the versioned functions
// live in lib/migrations.ts. normDoc stays as the boundary-facing name.
import { SCHEMA_VERSION } from "./migrations";
export { migrateDoc, migrateDoc as normDoc, SCHEMA_VERSION } from "./migrations";

export function newProjectDoc(name: string): Doc {
  // Readable slug plus enough randomness that a share URL cannot be guessed
  // or enumerated from the project name alone.
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" +
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  return {
    id, name, schemaVersion: SCHEMA_VERSION, rev: 1, updatedAt: Date.now(), updatedBy: "created",
    pages: [{ id: "root", name: "Home", parentId: null, order: 0, note: "", blocks: [
      { id: "b1", label: "Hero", glyphs: ["hero"], color: "content", note: "", component: "", flag: "", comments: [] },
    ] }],
    personas: [], journeys: [], notes: [], members: [],
  };
}

export const COLOR_STYLES: Record<ColorRole, { bg: string; fg: string; label: string }> = {
  header:  { bg: "#a855f7", fg: "#ffffff", label: "Global header" },
  nav:     { bg: "#f59e0b", fg: "#3b2604", label: "Section nav" },
  content: { bg: "#3b82f6", fg: "#ffffff", label: "Content" },
  footer:  { bg: "#10b981", fg: "#04352a", label: "Footer" },
  external:{ bg: "#64748b", fg: "#ffffff", label: "External system" },
};

// Chrome roles are shared by every intent, so they stay neutral rather than
// claiming one intent's colour.
export const CHROME_ROLES: ColorRole[] = ["header", "nav", "footer", "external"];
const CHROME_STYLE = { bg: "#94a3b8", fg: "#0f172a" };

/** Resolve how a block should be painted: intent colour when tagged, chrome
 *  grey for header/nav/footer/external, structural colour otherwise. */
export function blockStyle(b: Block, personas: Persona[]): { bg: string; fg: string; extra: string[] } {
  const tagged = (b.intents ?? []).map(id => personas.find(p => p.id === id)).filter(Boolean) as Persona[];
  const extra = tagged.slice(1).map(p => p.color);
  if (tagged.length > 0 && !CHROME_ROLES.includes(b.color)) {
    return { bg: tagged[0].color, fg: readableOn(tagged[0].color), extra };
  }
  if (CHROME_ROLES.includes(b.color)) return { ...CHROME_STYLE, extra };
  const s = COLOR_STYLES[b.color];
  return { bg: s.bg, fg: s.fg, extra };
}

/** Pick black or white text for a hex background by relative luminance. */
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.5 ? "#0f172a" : "#ffffff";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function blankBlock(partial?: Partial<Block>): Block {
  return {
    id: uid(), label: "New block", glyphs: ["textrows"], color: "content",
    note: "", component: "", flag: "", comments: [], ...partial,
  };
}
