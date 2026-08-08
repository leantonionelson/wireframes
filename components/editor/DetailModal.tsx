"use client";
import React, { useEffect, useRef, useState } from "react";
import { CHROME_ROLES, COLOR_STYLES, blockStyle, type Block, type ColorRole, type Page, type Persona } from "@/lib/model";
import { GLYPHS, Wireframe } from "@/lib/glyphs";
import { LogoMark } from "@/components/Theme";
import { CopyBtn } from "@/components/AiExchange";
import { ICONS } from "./icons";
import { IntentPicker } from "./IntentPicker";
import { GlyphPicker } from "./GlyphPicker";
import { Button, IconButton, Modal, ModalHeader } from "@/components/ui";

function pageToText(p: Page): string {
  const lines: string[] = [`# ${p.name}`, ""];
  if (p.note) lines.push(p.note, "");
  p.blocks.forEach(b => {
    lines.push(`## ${b.label}`);
    if (b.note) lines.push(b.note);
    if (b.component) lines.push(`Component: ${b.component}`);
    if (b.flag) lines.push(`FLAG: ${b.flag}`);
    b.comments.forEach(c => lines.push(`> ${c.author}: ${c.text}`));
    lines.push("");
  });
  return lines.join("\n");
}

/* ---------- comment input, one per block card in the detail modal ---------- */
function CommentBox({ me, onAdd }: { me: string; onAdd: (text: string) => void }) {
  const [t, setT] = useState("");
  const post = () => { if (t.trim()) { onAdd(t.trim()); setT(""); } };
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-[8px] font-bold shrink-0" title={me || "anon"}>{(me || "??").slice(0, 2).toUpperCase()}</span>
      <input className="flex-1 min-w-0 border border-[var(--border)] rounded-full px-3 py-1 bg-transparent outline-none text-[12.5px] placeholder-[var(--muted)]"
             placeholder="Add a comment…" value={t}
             onChange={e => setT(e.target.value)} onKeyDown={e => e.key === "Enter" && post()} />
      <button className="px-3 py-1 rounded-full text-[12px] text-[var(--accent)] hover:bg-[var(--hover)] disabled:opacity-40 shrink-0"
              disabled={!t.trim()} onClick={post}>Post</button>
    </div>
  );
}

/* ---------- read & copy detail modal ---------- */
export function DetailModal({ page, personas, me, canEdit, addComment, setPageNote, patchBlock, addBlk, delBlock, delPage, onClose }: {
  page: Page;
  personas: Persona[];
  me: string;
  canEdit: boolean;
  addComment: (pid: string, bid: string, text: string) => void;
  setPageNote: (pid: string, n: string) => void;
  patchBlock: (pid: string, bid: string, patch: Partial<Block>) => void;
  addBlk: () => void;
  delBlock: (bid: string) => void;
  delPage: () => void;
  onClose: () => void;
}) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  // Which blocks have their copy folded out. Collapsed by default: the page
  // reads as a stack of components first.
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());
  // which block currently has its wireframe picker open
  const [editingWireframe, setEditingWireframe] = useState<string | null>(null);
  const toggleBlock = (bid: string) =>
    setOpenBlocks(s => { const n = new Set(s); if (n.has(bid)) n.delete(bid); else n.add(bid); return n; });
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);
  const revealBlock = (bid: string) => {
    // Fold the copy out first so the scroll target has its final height.
    setOpenBlocks(s => new Set(s).add(bid));
    setTimeout(() => cardRefs.current[bid]?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    setFocusedBlock(bid);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFocusedBlock(null), 1800);
  };
  return (
    <Modal onClose={onClose} width="max-w-5xl">
      <>
        <ModalHeader onClose={onClose}
          title={<span className="flex items-center gap-2.5 text-[var(--accent)]"><span className="shrink-0"><LogoMark size={16} /></span><span className="truncate">{page.name}</span></span>}
          actions={<>
            <CopyBtn text={pageToText(page)} label="Copy page" />
            {canEdit && (
              <IconButton label="Delete page and children" danger
                          onClick={() => { if (confirm(`Delete "${page.name}" and its children?`)) { delPage(); onClose(); } }}>{ICONS.trash}</IconButton>
            )}
          </>} />
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-[15px] text-[var(--ink)]">About this page</h3>
                <CopyBtn text={page.note} />
              </div>
              {canEdit
                ? <textarea className="autogrow w-full bg-transparent outline-none text-[13.5px] leading-relaxed text-[var(--ink)] min-h-[48px]"
                            placeholder="Purpose of the page, user needs, evidence…"
                            value={page.note} onChange={e => setPageNote(page.id, e.target.value)} />
                : <p className="text-[13.5px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap">{page.note}</p>}
            </div>
            {page.blocks.map(b => {
              const c = blockStyle(b, personas);
              const isOpen = openBlocks.has(b.id);
              return (
              <div key={b.id} ref={el => { cardRefs.current[b.id] = el; }}
                   className={`rounded-2xl border overflow-hidden bg-[var(--card)] transition-shadow duration-300 scroll-mt-2 ${
                     focusedBlock === b.id ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
                   style={focusedBlock === b.id ? { boxShadow: "0 0 0 3px var(--accent-soft)" } : undefined}>
                {/* the block itself, as it looks on the canvas; the copy
                    folds out underneath so the page reads as components
                    first, detail on demand */}
                <div className="cursor-pointer select-none" style={{ background: c.bg, color: c.fg }}
                     onClick={() => toggleBlock(b.id)}>
                  <div className="flex items-center gap-2 px-4 pt-2.5">
                    {canEdit
                      ? <input className="font-bold text-[14px] bg-transparent outline-none flex-1 min-w-0 cursor-pointer focus:cursor-text" style={{ color: c.fg }}
                               value={b.label} onClick={e => e.stopPropagation()}
                               onChange={e => patchBlock(page.id, b.id, { label: e.target.value })} />
                      : <h4 className="font-bold text-[14px] flex-1 min-w-0 truncate">{b.label}</h4>}
                    {c.extra.map((col, i) => (
                      <span key={i} className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/50" style={{ background: col }} />
                    ))}
                    {b.flag && <span title={b.flag} className="shrink-0 text-[10px] bg-red-600 text-white rounded px-1.5 py-0.5 font-bold">!</span>}
                    {b.comments.length > 0 && <span className="shrink-0 text-[10px] bg-white/25 rounded px-1.5 py-0.5">{b.comments.length}</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                         className="shrink-0 opacity-70" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
                      <path d="M6 9l6 6 6-6" /></svg>
                  </div>
                  <div className="px-4 pb-2.5 pt-0.5"><Wireframe ids={b.glyphs} /></div>
                </div>
                {isOpen && <div className="p-5 pt-3.5">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <CopyBtn text={[b.label, b.note, b.component && `Component: ${b.component}`, b.flag && `FLAG: ${b.flag}`].filter(Boolean).join("\n")} />
                  {canEdit && (
                    <Button size="sm" variant="danger" title="Delete block" onClick={() => delBlock(b.id)}>{ICONS.trash}Delete</Button>
                  )}
                </div>
                {canEdit ? (
                  <>
                    <textarea className="autogrow w-full bg-transparent outline-none text-[13.5px] leading-relaxed text-[var(--ink)] mb-1 min-h-[24px]"
                              placeholder="Purpose, user needs, content status…"
                              value={b.note} onChange={e => patchBlock(page.id, b.id, { note: e.target.value })} />
                    <input className="w-full text-[13.5px] text-[var(--ink)] bg-transparent outline-none"
                           placeholder="Component, e.g. AEM: Promotional Banner"
                           value={b.component} onChange={e => patchBlock(page.id, b.id, { component: e.target.value })} />
                    <textarea className="autogrow w-full text-[13px] leading-relaxed text-red-500 font-medium mt-1.5 bg-transparent outline-none placeholder:text-red-300 min-h-[20px]"
                              placeholder="Red flag: custom component or pending decision…"
                              value={b.flag} onChange={e => patchBlock(page.id, b.id, { flag: e.target.value })} />
                  </>
                ) : (
                  <>
                    {b.note && <p className="text-[13.5px] leading-relaxed text-[var(--ink)] mb-1 whitespace-pre-wrap">{b.note}</p>}
                    {b.component && <p className="text-[13.5px] text-[var(--ink)]">{b.component}</p>}
                    {b.flag && <p className="text-[13px] leading-relaxed text-red-500 font-medium mt-1.5 whitespace-pre-wrap">{b.flag}</p>}
                  </>
                )}
                {canEdit && <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--border)]">
                  {CHROME_ROLES.includes(b.color)
                    ? (Object.keys(COLOR_STYLES) as ColorRole[]).map(c => (
                        <button key={c} title={COLOR_STYLES[c].label}
                                className={`w-4 h-4 rounded-full ${b.color === c ? "ring-2 ring-offset-1 ring-[var(--accent)] ring-offset-[var(--card)]" : ""}`}
                                style={{ background: COLOR_STYLES[c].bg }} onClick={() => patchBlock(page.id, b.id, { color: c })} />
                      ))
                    : <IntentPicker block={b} personas={personas}
                                    onChange={intents => patchBlock(page.id, b.id, { intents })} />}
                  <button className="ml-auto border border-[var(--border)] rounded-full px-3 py-0.5 text-[11px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)]"
                          onClick={() => setEditingWireframe(editingWireframe === b.id ? null : b.id)}>
                    {b.glyphs.map(g => GLYPHS[g]?.name ?? g).join(" + ")}
                  </button>
                </div>}
                {canEdit && editingWireframe === b.id && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border)]">
                    <GlyphPicker glyphs={b.glyphs} onChange={glyphs => patchBlock(page.id, b.id, { glyphs })} />
                  </div>
                )}
                <div className="mt-3 pt-2.5 border-t border-[var(--border)]">
                  {b.comments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {b.comments.map(c => (
                        <div key={c.id} className="text-[12.5px] bg-[var(--hover)] rounded-lg px-3 py-1.5">
                          <span className="tk text-[10px] text-[var(--muted)] mr-2">{c.author} · {new Date(c.at).toLocaleDateString()}</span>{c.text}
                        </div>
                      ))}
                    </div>
                  )}
                  <CommentBox me={me} onAdd={t => addComment(page.id, b.id, t)} />
                </div>
                </div>}
              </div>
            );})}
            {canEdit && (
              <Button className="w-full border-2 border-dashed py-3 text-[13px] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
                      onClick={addBlk}>+ block</Button>
            )}
          </div>
          <div className="hidden sm:block w-[240px] shrink-0 border-l border-[var(--border)] overflow-y-auto p-4">
            <div className="rounded-xl bg-[var(--card)] border-2 border-[var(--card-border)] overflow-hidden">
              <div className="text-center font-bold text-[12px] text-[var(--accent)] py-1.5">{page.name}</div>
              <div className="p-1.5 pt-0 flex flex-col gap-1">
                {page.blocks.map(b => {
                  const c = blockStyle(b, personas);
                  return (
                    <div key={b.id} onClick={() => revealBlock(b.id)}
                         title="Jump to this block's description"
                         className={`rounded px-1.5 pt-1 pb-0.5 cursor-pointer transition-shadow ${
                           focusedBlock === b.id
                             ? "ring-2 ring-offset-1 ring-[var(--accent)] ring-offset-[var(--card)]"
                             : "hover:ring-2 hover:ring-white/40"}`}
                         style={{ background: c.bg, color: c.fg }}>
                      <div className="flex items-center gap-1">
                        {canEdit
                          ? <input className="w-full text-[10px] font-semibold bg-transparent outline-none cursor-pointer focus:cursor-text" style={{ color: c.fg }}
                                   value={b.label} onChange={e => patchBlock(page.id, b.id, { label: e.target.value })} />
                          : <span className="w-full text-[10px] font-semibold truncate" style={{ color: c.fg }}>{b.label}</span>}
                        {c.extra.map((col, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/50" style={{ background: col }} />
                        ))}
                      </div>
                      <Wireframe ids={b.glyphs} gap={2} />
                    </div>
                  );
                })}
                {canEdit && (
                  <button className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] rounded-full py-0.5"
                          onClick={addBlk}>+ block</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    </Modal>
  );
}
