"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLOR_STYLES, type Block, type ColorRole, type Doc, type GlyphId, type Page, blankBlock, uid } from "@/lib/model";
import { GLYPHS, Glyph } from "@/lib/glyphs";

type Sel = { pageId: string; blockId?: string } | null;

export default function Editor() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("loading");
  const [me, setMe] = useState("");
  const docRef = useRef<Doc | null>(null);
  docRef.current = doc;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  // identity for collaboration attribution (editable in the header)
  useEffect(() => {
    setMe(localStorage.getItem("octo.name") || "anon");
  }, []);
  const changeMe = (n: string) => { setMe(n); localStorage.setItem("octo.name", n); };

  // initial load + poll for teammates' changes
  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch("/api/doc").then(r => r.json());
      if (!stop) { setDoc(r.doc); setStatus("saved"); }
    };
    load();
    const t = setInterval(async () => {
      const d = docRef.current;
      if (!d || dirtyRef.current) return;
      const r = await fetch(`/api/doc?since=${d.rev}`).then(r => r.json());
      if (!stop && !r.unchanged && r.doc) setDoc(r.doc);
    }, 4000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutate = useCallback((fn: (d: Doc) => Doc) => {
    setDoc(prev => {
      if (!prev) return prev;
      const next = fn(structuredClone(prev));
      return next;
    });
    setDirty(true);
    setStatus("editing");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const d = docRef.current;
      if (!d) return;
      setStatus("saving");
      const res = await fetch("/api/doc", { method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseRev: d.rev, doc: d, by: localStorage.getItem("octo.name") || "anon" }) });
      const j = await res.json();
      if (res.ok) { setDoc(j.doc); setDirty(false); setStatus("saved"); }
      else { setDoc(j.doc); setDirty(false); setStatus("updated by " + (j.doc.updatedBy || "teammate") + ", your last change re-applied manually if needed"); }
    }, 700);
  }, []);

  // ---------- pan & zoom ----------
  const [view, setView] = useState({ x: 60, y: 40, k: 0.8 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".card,.panel,button,input,textarea,select")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setView(v => ({ ...v, x: drag.current!.ox + e.clientX - drag.current!.sx, y: drag.current!.oy + e.clientY - drag.current!.sy }));
  };
  const onPointerUp = () => { drag.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setView(v => {
      const k = Math.min(2, Math.max(0.25, v.k * (e.deltaY > 0 ? 0.9 : 1.1)));
      return { k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) };
    });
  };

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Page[]>();
    (doc?.pages ?? []).forEach(p => {
      const arr = m.get(p.parentId) ?? [];
      arr.push(p); m.set(p.parentId, arr);
    });
    m.forEach(a => a.sort((x, y) => x.order - y.order));
    return m;
  }, [doc]);

  if (!doc) return <div className="p-10 text-sm text-neutral-500">Loading…</div>;

  const selPage = sel ? doc.pages.find(p => p.id === sel.pageId) ?? null : null;
  const selBlock = selPage && sel?.blockId ? selPage.blocks.find(b => b.id === sel.blockId) ?? null : null;

  // ---------- mutations ----------
  const renamePage = (pid: string, name: string) => mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.name = name; return d; });
  const setPageNote = (pid: string, note: string) => mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.note = note; return d; });
  const addChildPage = (pid: string | null) => mutate(d => {
    const sibs = d.pages.filter(p => p.parentId === pid);
    d.pages.push({ id: uid(), name: "New page", parentId: pid, order: sibs.length, note: "", blocks: [blankBlock({ label: "Hero", glyph: "hero" })] });
    return d;
  });
  const deletePage = (pid: string) => mutate(d => {
    const doomed = new Set<string>();
    const walk = (x: string) => { doomed.add(x); d.pages.filter(p => p.parentId === x).forEach(c => walk(c.id)); };
    walk(pid);
    d.pages = d.pages.filter(p => !doomed.has(p.id));
    return d;
  });
  const addBlock = (pid: string) => {
    const nb = blankBlock();
    mutate(d => { d.pages.find(p => p.id === pid)!.blocks.push(nb); return d; });
    setSel({ pageId: pid, blockId: nb.id });
  };
  const patchBlock = (pid: string, bid: string, patch: Partial<Block>) =>
    mutate(d => { const p = d.pages.find(p => p.id === pid)!; Object.assign(p.blocks.find(b => b.id === bid)!, patch); return d; });
  const moveBlock = (pid: string, bid: string, dir: -1 | 1) => mutate(d => {
    const p = d.pages.find(p => p.id === pid)!;
    const i = p.blocks.findIndex(b => b.id === bid);
    const j = i + dir;
    if (j < 0 || j >= p.blocks.length) return d;
    [p.blocks[i], p.blocks[j]] = [p.blocks[j], p.blocks[i]];
    return d;
  });
  const deleteBlock = (pid: string, bid: string) => { mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.blocks = p.blocks.filter(b => b.id !== bid); return d; }); setSel({ pageId: pid }); };
  const addComment = (pid: string, bid: string, text: string) =>
    mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.blocks.find(b => b.id === bid)!.comments.push({ id: uid(), author: me, text, at: Date.now() }); return d; });

  // ---------- render tree ----------
  const renderPage = (p: Page): React.ReactNode => {
    const kids = childrenOf.get(p.id) ?? [];
    return (
      <li key={p.id}>
        <PageCard page={p} sel={sel} setSel={setSel} rename={renamePage} addBlock={addBlock} addChild={addChildPage} del={deletePage} />
        {kids.length > 0 && <ul>{kids.map(renderPage)}</ul>}
      </li>
    );
  };
  const roots = childrenOf.get(null) ?? [];

  return (
    <div className="h-screen flex flex-col bg-[#eef1f6] text-neutral-900">
      <header className="flex items-center gap-4 px-5 py-2.5 bg-white border-b border-neutral-200 z-10">
        <span className="text-lg" aria-hidden>🐙</span>
        <input className="font-semibold text-[15px] bg-transparent outline-none min-w-[300px]" value={doc.name}
               onChange={e => mutate(d => { d.name = e.target.value; return d; })} />
        <span className="text-xs text-neutral-400">{status}{doc.updatedBy && status === "saved" ? ` · last edit ${doc.updatedBy}` : ""}</span>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button className="px-2 py-1 border rounded" onClick={() => addChildPage(null)}>+ Top-level page</button>
          <button className="px-2 py-1 border rounded" onClick={() => setView({ x: 60, y: 40, k: 0.8 })}>Fit</button>
          <button className="px-2 py-1 border rounded" onClick={() => setView(v => ({ ...v, k: Math.max(0.25, v.k * 0.9) }))}>−</button>
          <button className="px-2 py-1 border rounded" onClick={() => setView(v => ({ ...v, k: Math.min(2, v.k * 1.1) }))}>+</button>
          <span className="w-9 text-center tabular-nums">{Math.round(view.k * 100)}%</span>
          <span className="px-2 py-1 rounded-full bg-lime-400 text-[11px] font-bold" title="Shown to teammates on your edits">{(me || "??").slice(0, 2).toUpperCase()}</span>
          <input className="border rounded px-2 py-1 w-24" value={me} placeholder="your name" onChange={e => changeMe(e.target.value)} />
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden" ref={canvasRef}
           onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}
           style={{ cursor: drag.current ? "grabbing" : "grab" }}>
        <div style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})`, transformOrigin: "0 0", width: "max-content" }}>
          <div className="tree px-10 py-8"><ul>{roots.map(renderPage)}</ul></div>
        </div>

        {selPage && (
          <Inspector page={selPage} block={selBlock} me={me}
            close={() => setSel(null)}
            setPageNote={setPageNote}
            patchBlock={patchBlock} moveBlock={moveBlock} deleteBlock={deleteBlock} addComment={addComment} />
        )}
      </div>
    </div>
  );
}

function PageCard({ page, sel, setSel, rename, addBlock, addChild, del }: {
  page: Page; sel: Sel; setSel: (s: Sel) => void;
  rename: (pid: string, name: string) => void;
  addBlock: (pid: string) => void; addChild: (pid: string) => void; del: (pid: string) => void;
}) {
  const active = sel?.pageId === page.id;
  return (
    <div className={`card w-[230px] rounded-lg bg-white border-2 ${page.external ? "border-dashed border-neutral-400" : active ? "border-blue-600" : "border-blue-500/70"} shadow-sm`}
         onClick={e => { e.stopPropagation(); if (!(e.target as HTMLElement).closest(".blk")) setSel({ pageId: page.id }); }}>
      <div className="flex items-center gap-1 px-2 pt-1.5">
        <input className="w-full text-center font-bold text-[12.5px] text-blue-700 outline-none bg-transparent"
               value={page.name} onChange={e => rename(page.id, e.target.value)} onClick={e => e.stopPropagation()} />
      </div>
      <div className="p-1.5 pt-1 flex flex-col gap-1">
        {page.blocks.map(b => {
          const c = COLOR_STYLES[b.color];
          const on = sel?.pageId === page.id && sel?.blockId === b.id;
          return (
            <div key={b.id}
                 className={`blk rounded px-1.5 pt-1 pb-0.5 cursor-pointer ${on ? "ring-2 ring-fuchsia-400" : ""}`}
                 style={{ background: c.bg, color: c.fg }}
                 onClick={e => { e.stopPropagation(); setSel({ pageId: page.id, blockId: b.id }); }}>
                <div className="flex items-center gap-1 text-[10.5px] font-semibold leading-tight">
                  <span className="truncate">{b.label}</span>
                  {b.flag && <span title={b.flag} className="ml-auto text-[9px] bg-red-600 text-white rounded px-1">!</span>}
                  {b.comments.length > 0 && <span className="text-[9px] bg-white/25 rounded px-1">{b.comments.length}</span>}
                </div>
                <Glyph id={b.glyph} />
            </div>
          );
        })}
        <div className="flex gap-1">
          <button className="flex-1 text-[10.5px] text-neutral-400 hover:text-blue-600 border border-dashed border-neutral-300 rounded py-0.5"
                  onClick={e => { e.stopPropagation(); addBlock(page.id); }}>+ block</button>
          <button className="text-[10.5px] text-neutral-400 hover:text-blue-600 border border-dashed border-neutral-300 rounded px-1.5"
                  title="Add child page" onClick={e => { e.stopPropagation(); addChild(page.id); }}>+ page</button>
          <button className="text-[10.5px] text-neutral-400 hover:text-red-600 border border-dashed border-neutral-300 rounded px-1.5"
                  title="Delete page and children" onClick={e => { e.stopPropagation(); if (confirm(`Delete "${page.name}" and its children?`)) del(page.id); }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

function Inspector({ page, block, me, close, setPageNote, patchBlock, moveBlock, deleteBlock, addComment }: {
  page: Page; block: Block | null; me: string; close: () => void;
  setPageNote: (pid: string, n: string) => void;
  patchBlock: (pid: string, bid: string, patch: Partial<Block>) => void;
  moveBlock: (pid: string, bid: string, dir: -1 | 1) => void;
  deleteBlock: (pid: string, bid: string) => void;
  addComment: (pid: string, bid: string, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <aside className="panel absolute top-3 right-3 bottom-3 w-[360px] bg-white rounded-xl shadow-xl border border-neutral-200 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2.5 border-b border-neutral-100">
        <div className="text-sm font-bold text-blue-700 truncate">{page.name}{block ? ` · ${block.label}` : ""}</div>
        <button className="ml-auto text-neutral-400 hover:text-neutral-700" onClick={close}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px]">
        {!block && (
          <>
            <Field label="Page note">
              <textarea className="w-full border rounded p-2 min-h-[180px]" value={page.note}
                        onChange={e => setPageNote(page.id, e.target.value)} />
            </Field>
            <p className="text-neutral-400 text-xs">Select a block on the card to edit its label, wireframe, colour, notes and comments.</p>
          </>
        )}
        {block && (
          <>
            <Field label="Label">
              <input className="w-full border rounded p-2" value={block.label}
                     onChange={e => patchBlock(page.id, block.id, { label: e.target.value })} />
            </Field>
            <Field label="Wireframe">
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(GLYPHS) as GlyphId[]).map(g => (
                  <button key={g} title={GLYPHS[g].name}
                          className={`border rounded p-1 text-blue-600 ${block.glyph === g ? "border-blue-600 bg-blue-50" : "border-neutral-200"}`}
                          onClick={() => patchBlock(page.id, block.id, { glyph: g })}>
                    {GLYPHS[g].el}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Colour">
              <div className="flex gap-1.5">
                {(Object.keys(COLOR_STYLES) as ColorRole[]).map(c => (
                  <button key={c} title={COLOR_STYLES[c].label}
                          className={`w-7 h-7 rounded ${block.color === c ? "ring-2 ring-offset-1 ring-neutral-700" : ""}`}
                          style={{ background: COLOR_STYLES[c].bg }}
                          onClick={() => patchBlock(page.id, block.id, { color: c })} />
                ))}
              </div>
            </Field>
            <Field label="Component">
              <input className="w-full border rounded p-2" placeholder="AEM: Promotional Banner"
                     value={block.component} onChange={e => patchBlock(page.id, block.id, { component: e.target.value })} />
            </Field>
            <Field label="Note (purpose, user needs, content status)">
              <textarea className="w-full border rounded p-2 min-h-[120px]" value={block.note}
                        onChange={e => patchBlock(page.id, block.id, { note: e.target.value })} />
            </Field>
            <Field label="Red flag (custom component or pending decision)">
              <textarea className="w-full border rounded p-2 min-h-[52px] text-red-700" value={block.flag}
                        onChange={e => patchBlock(page.id, block.id, { flag: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" onClick={() => moveBlock(page.id, block.id, -1)}>↑ Move up</button>
              <button className="px-2 py-1 border rounded" onClick={() => moveBlock(page.id, block.id, 1)}>↓ Move down</button>
              <button className="ml-auto px-2 py-1 border rounded text-red-600" onClick={() => deleteBlock(page.id, block.id)}>Delete</button>
            </div>
            <Field label={`Comments (${block.comments.length})`}>
              <div className="space-y-2">
                {block.comments.map(c => (
                  <div key={c.id} className="bg-neutral-50 border border-neutral-100 rounded p-2">
                    <div className="text-[11px] text-neutral-400">{c.author} · {new Date(c.at).toLocaleString()}</div>
                    <div>{c.text}</div>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <input className="flex-1 border rounded p-2" placeholder={`Comment as ${me}…`} value={draft}
                         onChange={e => setDraft(e.target.value)}
                         onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { addComment(page.id, block.id, draft.trim()); setDraft(""); } }} />
                  <button className="px-2 border rounded" onClick={() => { if (draft.trim()) { addComment(page.id, block.id, draft.trim()); setDraft(""); } }}>Add</button>
                </div>
              </div>
            </Field>
          </>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">{label}</div>
      {children}
    </div>
  );
}
