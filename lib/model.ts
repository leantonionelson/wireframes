// Octo data model. One Doc per project. Pages form a tree via parentId.
// Blocks stack inside a page in order. Everything is plain JSON so the
// storage layer can later be swapped for a CRDT (Yjs) without a rewrite.

export type ColorRole = "header" | "nav" | "content" | "footer" | "external";

export type GlyphId =
  | "hero" | "textrows" | "text2col" | "cards3" | "cards4" | "image"
  | "video" | "people" | "accordion" | "search" | "map" | "form"
  | "stats" | "carousel" | "cta" | "links" | "linker" | "quote";

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: number; // epoch ms
}

export interface Block {
  id: string;
  label: string;
  glyph: GlyphId;
  color: ColorRole;
  note: string;        // markdown-ish free text: purpose, needs, content status
  component: string;   // e.g. "AEM: Promotional Banner"
  flag: string;        // red flag text, empty if none
  comments: Comment[];
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

export interface Doc {
  id: string;
  name: string;
  rev: number;
  updatedAt: number;
  updatedBy: string;
  pages: Page[];
}

export const COLOR_STYLES: Record<ColorRole, { bg: string; fg: string; label: string }> = {
  header:  { bg: "#a855f7", fg: "#ffffff", label: "Global header" },
  nav:     { bg: "#f59e0b", fg: "#3b2604", label: "Section nav" },
  content: { bg: "#3b82f6", fg: "#ffffff", label: "Content" },
  footer:  { bg: "#10b981", fg: "#04352a", label: "Footer" },
  external:{ bg: "#64748b", fg: "#ffffff", label: "External system" },
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function blankBlock(partial?: Partial<Block>): Block {
  return {
    id: uid(), label: "New block", glyph: "textrows", color: "content",
    note: "", component: "", flag: "", comments: [], ...partial,
  };
}
