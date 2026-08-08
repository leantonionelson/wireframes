"use client";
import React from "react";
import { blockStyle, type Page, type Persona } from "@/lib/model";
import { Wireframe } from "@/lib/glyphs";
import type { Sel } from "./types";

/* ---------- page card on canvas ---------- */
export function PageCard({ page, sel, setSel, rename, addBlock, addChild, personas, canEdit }: {
  page: Page; sel: Sel; setSel: (s: Sel) => void;
  rename: (pid: string, name: string) => void;
  addBlock: (pid: string) => void; addChild: (pid: string) => void;
  personas: Persona[];
  canEdit: boolean;
}) {
  const active = sel?.pageId === page.id && !sel?.blockId;
  return (
    <div id={`page-${page.id}`}
         className={`card w-[230px] rounded-xl bg-[var(--card)] border-2 ${page.external ? "border-dashed border-[var(--muted)]" : active ? "border-[var(--accent)]" : "border-[var(--card-border)]"} shadow-sm`}
         onClick={e => { e.stopPropagation(); if (!(e.target as HTMLElement).closest(".blk,button,input")) setSel({ pageId: page.id }); }}>
      <div className="flex items-center gap-1 px-2 pt-1.5">
        {canEdit
          ? <input className="w-full text-center font-bold text-[12.5px] text-[var(--accent)] outline-none bg-transparent"
                   value={page.name} onChange={e => rename(page.id, e.target.value)}
                   onFocus={() => setSel({ pageId: page.id })} onClick={e => e.stopPropagation()} />
          : <div className="w-full text-center font-bold text-[12.5px] text-[var(--accent)] truncate">{page.name}</div>}
      </div>
      <div className="p-1.5 pt-1 flex flex-col gap-1">
        {page.blocks.map(b => {
          const c = blockStyle(b, personas);
          const on = sel?.pageId === page.id && sel?.blockId === b.id;
          return (
            /* The intent colour is the block's tag: a label bar above the
               wireframe, not a brick behind it. The drawing sits on paper so
               it reads as layout. */
            <div key={b.id} id={`blk-${b.id}`}
                 className={`blk rounded-md overflow-hidden cursor-pointer ${on ? "ring-2 ring-[var(--accent)]" : ""}`}
                 style={{ background: c.bg, color: c.fg }}
                 onClick={e => { e.stopPropagation(); setSel({ pageId: page.id, blockId: b.id }); }}>
              <div className="flex items-center gap-1 text-[10px] font-semibold leading-tight px-1.5 py-[3px]">
                <span className="truncate">{b.label}</span>
                {c.extra.map((col, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/50" style={{ background: col }} />
                ))}
                {b.flag && <span title={b.flag} className="ml-auto text-[9px] bg-red-600 text-white rounded px-1">!</span>}
                {b.comments.length > 0 && <span className="text-[9px] bg-white/25 rounded px-1">{b.comments.length}</span>}
              </div>
              <div className="px-[3px] pb-[3px]"><Wireframe ids={b.glyphs} gap={2} accent={c.bg} /></div>
            </div>
          );
        })}
        {canEdit && (
          <div className="flex gap-1">
            <button className="flex-1 text-[10.5px] text-[var(--muted)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] rounded-full py-0.5"
                    onClick={e => { e.stopPropagation(); addBlock(page.id); }}>+ block</button>
            <button className="flex-1 text-[10.5px] text-[var(--muted)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] rounded-full py-0.5"
                    title="Add a child page below this one"
                    onClick={e => { e.stopPropagation(); addChild(page.id); }}>+ page</button>
          </div>
        )}
      </div>
    </div>
  );
}
