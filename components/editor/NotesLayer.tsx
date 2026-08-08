"use client";
import React, { useLayoutEffect, useState } from "react";
import type { PinNote } from "@/lib/model";
import { ICONS } from "./icons";

/* ---------- pinned notes overlay ---------- */
export function NotesLayer({ notes, openId, setOpenId, canEdit, me, patchNote, deleteNote, deps }: {
  notes: PinNote[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  canEdit: boolean;
  me: string;
  patchNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
  deps: unknown[];
}) {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  useLayoutEffect(() => {
    const next: Record<string, { x: number; y: number }> = {};
    notes.forEach(n => {
      // Anchor to the block when it still exists, else fall back to its page.
      const el = (n.blockId ? document.getElementById(`blk-${n.blockId}`) : null)
              ?? document.getElementById(`page-${n.pageId}`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      next[n.id] = { x: r.left + n.fx * r.width, y: r.top + n.fy * r.height };
    });
    setPos(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const open = openId ? notes.find(n => n.id === openId) : undefined;
  // Editors can modify any note; everyone else only their own.
  const canModify = !!open && (canEdit || open.author === (me || "anon"));
  const op = open ? pos[open.id] : undefined;
  const px = op ? Math.min(op.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 296) : 0;
  const py = op ? Math.min(Math.max(op.y - 10, 64), (typeof window !== "undefined" ? window.innerHeight : 800) - 220) : 0;
  return (
    <>
      {notes.map((n, i) => {
        const p = pos[n.id];
        if (!p) return null;
        return (
          <button key={n.id}
                  className={`fixed z-[22] w-5 h-5 -ml-2.5 -mt-2.5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 ${openId === n.id ? "bg-amber-500 text-white scale-110" : "bg-amber-400 text-amber-950"}`}
                  style={{ left: p.x, top: p.y }}
                  title={`${n.author}: ${n.text.slice(0, 60) || "(empty note)"}`}
                  onClick={e => { e.stopPropagation(); setOpenId(openId === n.id ? null : n.id); }}>
            {i + 1}
          </button>
        );
      })}
      {open && op && (
        <div className="panel fixed z-[35] w-[280px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-3.5"
             style={{ left: px, top: py }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="tk text-[10.5px] text-[var(--muted)] truncate">{open.author} · {new Date(open.at).toLocaleString()}</span>
            {canModify && (
              <button className="ml-auto text-[var(--muted)] hover:text-red-500 shrink-0" title="Delete note" onClick={() => deleteNote(open.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
              </button>
            )}
            <button className={`${canModify ? "" : "ml-auto "}text-[var(--muted)] hover:text-[var(--ink)] shrink-0`} title="Close" onClick={() => setOpenId(null)}>{ICONS.close}</button>
          </div>
          {canModify
            ? <textarea autoFocus className="autogrow w-full bg-transparent outline-none text-[13px] leading-relaxed min-h-[56px]"
                        placeholder="What should the team know here?"
                        value={open.text} onChange={e => patchNote(open.id, e.target.value)} />
            : <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{open.text || <span className="text-[var(--muted)]">(empty note)</span>}</p>}
        </div>
      )}
    </>
  );
}
