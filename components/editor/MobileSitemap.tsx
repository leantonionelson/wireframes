"use client";
import React, { useState } from "react";
import { blockStyle, type Doc, type Page } from "@/lib/model";
import { Glyph } from "@/lib/glyphs";

/* The phone projection: the same document as a hierarchical, expandable
 * list instead of a spatial canvas (blueprint §13 — a different projection,
 * not a shrunken canvas). Every row is the page's actual wireframe — the
 * same block stack as the desktop card, full width — and tapping it opens
 * the detail view full-screen. Pinned notes anchor to canvas geometry, so
 * here they surface as a count in the row header. */

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
    const notes = doc.notes.filter(n => n.pageId === p.id).length;
    return (
      <React.Fragment key={p.id}>
        <div className="flex items-start gap-0.5" style={{ paddingLeft: depth * 16 }}>
          <button className={`w-7 h-10 flex items-center justify-center text-[var(--muted)] shrink-0 ${children.length ? "" : "invisible"}`}
                  aria-label={closed ? "Expand" : "Collapse"}
                  onClick={() => toggle(p.id)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                 style={{ transform: closed ? "rotate(-90deg)" : "none", transition: "transform 120ms" }}>
              <path d="M6 9l6 6 6-6" /></svg>
          </button>
          {/* the page's real wireframe, same language as the desktop card */}
          <button className={`flex-1 min-w-0 rounded-xl border-2 my-1 text-left bg-[var(--card)] active:opacity-80 overflow-hidden ${p.external ? "border-dashed border-[var(--muted)]" : "border-[var(--card-border)]"}`}
                  onClick={() => open(p.id)}>
            <span className="flex items-center gap-2 px-2.5 pt-1.5 pb-0.5">
              <span className="flex-1 min-w-0 text-center font-bold text-[13px] text-[var(--accent)] truncate">{p.name}</span>
              {notes > 0 && (
                <span className="shrink-0 text-[9px] font-bold bg-amber-400 text-amber-950 rounded-full px-1.5 py-0.5">{notes}</span>
              )}
            </span>
            <span className="block p-1.5 pt-0.5 space-y-1">
              {p.blocks.map(b => {
                const c = blockStyle(b, doc.personas);
                return (
                  <span key={b.id} className="block rounded px-1.5 pt-1 pb-0.5" style={{ background: c.bg, color: c.fg }}>
                    <span className="flex items-center gap-1 text-[10.5px] font-semibold leading-tight">
                      <span className="truncate">{b.label}</span>
                      {c.extra.map((col, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/50" style={{ background: col }} />
                      ))}
                      {b.flag && <span title={b.flag} className="ml-auto text-[9px] bg-red-600 text-white rounded px-1">!</span>}
                      {b.comments.length > 0 && <span className="text-[9px] bg-white/25 rounded px-1">{b.comments.length}</span>}
                    </span>
                    <Glyph id={b.glyph} />
                  </span>
                );
              })}
            </span>
          </button>
        </div>
        {!closed && children.map(c => row(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="absolute inset-0 overflow-y-auto px-3 pt-20 pb-28">
      <div className="max-w-[420px] mx-auto">
        {kids(null).map(p => row(p, 0))}
        {canEdit && (
          <button className="mt-2 w-full rounded-2xl border-2 border-dashed border-[var(--border)] py-3 text-[13px] text-[var(--muted)] active:bg-[var(--hover)]"
                  onClick={() => addChild(null)}>+ page</button>
        )}
      </div>
    </div>
  );
}
