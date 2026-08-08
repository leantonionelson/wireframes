"use client";
import React, { useState } from "react";
import { blockStyle, type Doc, type Page } from "@/lib/model";

/* The phone projection: the same document as a hierarchical, expandable
 * list instead of a spatial canvas (blueprint §13 — a different projection,
 * not a shrunken canvas). Tapping a page opens the detail view full-screen;
 * that is where all reading and editing happens on mobile. Pinned notes
 * anchor to canvas geometry, so here they surface as counts, not pins. */

export function MobileSitemap({ doc, open, addChild, canEdit }: {
  doc: Doc;
  open: (pageId: string) => void;
  addChild: (parentId: string | null) => void;
  canEdit: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const kids = (pid: string | null) =>
    doc.pages.filter(p => p.parentId === pid).sort((a, b) => a.order - b.order);
  const toggle = (id: string) =>
    setCollapsed(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const row = (p: Page, depth: number): React.ReactNode => {
    const children = kids(p.id);
    const closed = collapsed.has(p.id);
    const flags = p.blocks.filter(b => b.flag).length;
    const comments = p.blocks.reduce((n, b) => n + b.comments.length, 0);
    const notes = doc.notes.filter(n => n.pageId === p.id).length;
    return (
      <React.Fragment key={p.id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 18 }}>
          <button className={`w-8 h-8 flex items-center justify-center text-[var(--muted)] shrink-0 ${children.length ? "" : "invisible"}`}
                  aria-label={closed ? "Expand" : "Collapse"}
                  onClick={() => toggle(p.id)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                 style={{ transform: closed ? "rotate(-90deg)" : "none", transition: "transform 120ms" }}>
              <path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button className={`flex-1 min-w-0 flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 my-0.5 text-left bg-[var(--card)] active:bg-[var(--hover)] ${p.external ? "border-dashed border-[var(--muted)]" : "border-[var(--card-border)]"}`}
                  onClick={() => open(p.id)}>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[var(--accent)] truncate">{p.name}</span>
              <span className="tk block text-[10.5px] text-[var(--muted)]">
                {p.blocks.length} block{p.blocks.length === 1 ? "" : "s"}
                {comments > 0 ? ` · ${comments} comment${comments === 1 ? "" : "s"}` : ""}
                {notes > 0 ? ` · ${notes} note${notes === 1 ? "" : "s"}` : ""}
              </span>
            </span>
            {flags > 0 && <span className="shrink-0 text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5 font-bold">{flags}</span>}
            {/* first few block colours as a spine, so a row still reads as a wireframe */}
            <span className="shrink-0 flex flex-col gap-[2px]">
              {p.blocks.slice(0, 5).map(b => (
                <span key={b.id} className="w-5 h-[5px] rounded-sm" style={{ background: blockStyle(b, doc.personas).bg }} />
              ))}
            </span>
          </button>
        </div>
        {!closed && children.map(c => row(c, depth + 1))}
        {!closed && canEdit && children.length > 0 && depth === 0 && null}
      </React.Fragment>
    );
  };

  return (
    // Same graph-paper background as the canvas, so mobile still reads as
    // Scaffolds; static rather than panning, since the list scrolls.
    <div className="absolute inset-0 overflow-y-auto px-3 pt-20 pb-28"
         style={{ backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
                  backgroundSize: "24px 24px" }}>
      {kids(null).map(p => row(p, 0))}
      {canEdit && (
        <button className="mt-2 w-full rounded-2xl border-2 border-dashed border-[var(--border)] py-3 text-[13px] text-[var(--muted)] active:bg-[var(--hover)]"
                onClick={() => addChild(null)}>+ page</button>
      )}
    </div>
  );
}
