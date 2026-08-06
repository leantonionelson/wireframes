"use client";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { COLOR_STYLES, PERSONA_COLORS, normDoc, type Block, type ColorRole, type Doc, type GlyphId, type Journey, type Page, type Persona, blankBlock, uid } from "@/lib/model";
import { GLYPHS, Glyph } from "@/lib/glyphs";
import { LogoMark, ThemeToggle } from "@/components/Theme";

type Sel = { pageId: string; blockId?: string } | null;
type Snap = Pick<Doc, "name" | "pages" | "personas" | "journeys">;
type Panel = "inspector" | "history" | "journeys" | null;
const COLOR_ORDER: ColorRole[] = ["header", "nav", "content", "footer", "external"];

const I = (d: React.ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONS = {
  up: I(<path d="M18 15l-6-6-6 6" />),
  down: I(<path d="M6 9l6 6 6-6" />),
  dup: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>),
  edit: I(<><path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" /><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" /></>),
  trash: I(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />),
  plus: I(<path d="M12 5v14M5 12h14" />),
  page: I(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>),
  detail: I(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16M6 9h4M6 13h4" /></>),
  copy: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>),
  check: I(<path d="M20 6L9 17l-5-5" />),
  export: I(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
  close: I(<path d="M18 6L6 18M6 6l12 12" />),
  undo: I(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>),
  redo: I(<><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>),
  clock: I(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>),
  route: I(<><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6.5" /></>),
  eye: I(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: I(<><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.4 0-10-7-10-7a20 20 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c6.4 0 10 7 10 7a19.8 19.8 0 0 1-3.22 4.31" /><line x1="2" y1="2" x2="22" y2="22" /></>),
  rec: I(<circle cx="12" cy="12" r="6" />),
};

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

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button title="Copy"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] text-[11px] shrink-0"
      onClick={async e => { e.stopPropagation(); await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}>
      {done ? ICONS.check : ICONS.copy}{label && <span>{done ? "Copied" : label}</span>}
    </button>
  );
}

export default function Editor({ projectId }: { projectId: string }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [detailPageId, setDetailPageId] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("loading");
  const [me, setMe] = useState("");
  const docRef = useRef<Doc | null>(null);
  docRef.current = doc;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const history = useRef<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });
  const visInit = useRef(false);

  useEffect(() => {
    setMe(localStorage.getItem("scaffold.name") || localStorage.getItem("octo.name") || "anon");
  }, []);
  const changeMe = (n: string) => { setMe(n); localStorage.setItem("scaffold.name", n); };

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch(`/api/doc?id=${projectId}`).then(r => r.json());
      if (!stop) { setDoc(r.doc ? normDoc(r.doc) : null); setStatus(r.doc ? "saved" : "not found"); }
    };
    load();
    const t = setInterval(async () => {
      const d = docRef.current;
      if (!d || dirtyRef.current) return;
      const r = await fetch(`/api/doc?id=${projectId}&since=${d.rev}`).then(r => r.json());
      if (!stop && !r.unchanged && r.doc) setDoc(normDoc(r.doc));
    }, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [projectId]);

  useEffect(() => {
    if (doc && !visInit.current) { visInit.current = true; setVisible(new Set(doc.journeys.map(j => j.id))); }
  }, [doc]);

  /* ---------- save & undo machinery ---------- */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(() => {
    setDirty(true);
    setStatus("editing");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const d = docRef.current;
      if (!d) return;
      setStatus("saving");
      const res = await fetch("/api/doc", { method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseRev: d.rev, doc: d, by: localStorage.getItem("scaffold.name") || "anon" }) });
      const j = await res.json();
      if (res.ok) { setDoc(normDoc(j.doc)); setDirty(false); setStatus("saved"); }
      else { setDoc(j.doc ? normDoc(j.doc) : docRef.current); setDirty(false); setStatus("updated by " + (j.doc?.updatedBy || "teammate")); }
    }, 700);
  }, []);

  const snapOf = (d: Doc): Snap => structuredClone({ name: d.name, pages: d.pages, personas: d.personas, journeys: d.journeys });
  const mutate = useCallback((fn: (d: Doc) => Doc) => {
    setDoc(prev => {
      if (!prev) return prev;
      history.current.past.push(snapOf(prev));
      if (history.current.past.length > 60) history.current.past.shift();
      history.current.future = [];
      return fn(structuredClone(prev));
    });
    scheduleSave();
  }, [scheduleSave]);

  const undo = useCallback(() => {
    const cur = docRef.current;
    const s = history.current.past.pop();
    if (!cur || !s) return;
    history.current.future.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const cur = docRef.current;
    const s = history.current.future.pop();
    if (!cur || !s) return;
    history.current.past.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === "Escape") { setDetailPageId(null); setPanel(null); setSel(null); setRecording(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ---------- pan & zoom ---------- */
  const [view, setView] = useState({ x: 60, y: 84, k: 0.8 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".card,.panel,.toolbar,.cluster,button,input,textarea,select")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
    const x = d.ox + e.clientX - d.sx, y = d.oy + e.clientY - d.sy;
    setView(v => ({ ...v, x, y }));
  };
  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) { setSel(null); if (panel === "inspector") setPanel(null); }
    drag.current = null;
  };
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        setView(v => {
          const k = Math.min(2, Math.max(0.25, v.k * (e.deltaY > 0 ? 0.9 : 1.1)));
          return { k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) };
        });
      } else {
        setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [doc ? 1 : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Page[]>();
    (doc?.pages ?? []).forEach(p => {
      const arr = m.get(p.parentId) ?? [];
      arr.push(p); m.set(p.parentId, arr);
    });
    m.forEach(a => a.sort((x, y) => x.order - y.order));
    return m;
  }, [doc]);

  if (!doc) return <div className="p-10 text-sm text-[var(--muted)]">Loading…</div>;

  const selPage = sel ? doc.pages.find(p => p.id === sel.pageId) ?? null : null;
  const selBlock = selPage && sel?.blockId ? selPage.blocks.find(b => b.id === sel.blockId) ?? null : null;
  const detailPage = detailPageId ? doc.pages.find(p => p.id === detailPageId) ?? null : null;
  const recJourney = recording ? doc.journeys.find(j => j.id === recording) ?? null : null;

  /* ---------- mutations ---------- */
  const renamePage = (pid: string, name: string) => mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.name = name; return d; });
  const setPageNote = (pid: string, note: string) => mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.note = note; return d; });
  const addChildPage = (pid: string | null) => mutate(d => {
    const sibs = d.pages.filter(p => p.parentId === pid);
    d.pages.push({ id: uid(), name: "New page", parentId: pid, order: sibs.length, note: "", blocks: [blankBlock({ label: "Hero", glyph: "hero" })] });
    return d;
  });
  const deletePage = (pid: string) => {
    mutate(d => {
      const doomed = new Set<string>();
      const walk = (x: string) => { doomed.add(x); d.pages.filter(p => p.parentId === x).forEach(c => walk(c.id)); };
      walk(pid);
      d.pages = d.pages.filter(p => !doomed.has(p.id));
      d.journeys.forEach(j => { j.steps = j.steps.filter(s => !doomed.has(s)); });
      return d;
    });
    setSel(null); if (panel === "inspector") setPanel(null);
  };
  const addBlock = (pid: string) => {
    const nb = blankBlock();
    mutate(d => { d.pages.find(p => p.id === pid)!.blocks.push(nb); return d; });
    setSel({ pageId: pid, blockId: nb.id });
    setPanel("inspector");
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
  const duplicateBlock = (pid: string, bid: string) => {
    const nid = uid();
    mutate(d => {
      const p = d.pages.find(p => p.id === pid)!;
      const i = p.blocks.findIndex(b => b.id === bid);
      const copy = structuredClone(p.blocks[i]);
      copy.id = nid; copy.comments = [];
      p.blocks.splice(i + 1, 0, copy);
      return d;
    });
    setSel({ pageId: pid, blockId: nid });
  };
  const cycleColor = (pid: string, bid: string) => mutate(d => {
    const b = d.pages.find(p => p.id === pid)!.blocks.find(b => b.id === bid)!;
    b.color = COLOR_ORDER[(COLOR_ORDER.indexOf(b.color) + 1) % COLOR_ORDER.length];
    return d;
  });
  const deleteBlock = (pid: string, bid: string) => { mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.blocks = p.blocks.filter(b => b.id !== bid); return d; }); setSel({ pageId: pid }); };
  const addComment = (pid: string, bid: string, text: string) =>
    mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.blocks.find(b => b.id === bid)!.comments.push({ id: uid(), author: me, text, at: Date.now() }); return d; });

  /* journeys */
  const addPersona = (name: string, color: string, desc: string) =>
    mutate(d => { d.personas.push({ id: uid(), name, color, desc }); return d; });
  const deletePersona = (perId: string) => mutate(d => {
    d.personas = d.personas.filter(p => p.id !== perId);
    d.journeys = d.journeys.filter(j => j.personaId !== perId);
    return d;
  });
  const addJourney = (name: string, personaId: string) => {
    const jid = uid();
    mutate(d => { d.journeys.push({ id: jid, personaId, name, steps: [] }); return d; });
    setVisible(v => new Set(v).add(jid));
    setRecording(jid);
  };
  const appendStep = (jid: string, pageId: string) => mutate(d => {
    const j = d.journeys.find(j => j.id === jid);
    if (j && j.steps[j.steps.length - 1] !== pageId) j.steps.push(pageId);
    return d;
  });
  const removeStep = (jid: string, idx: number) => mutate(d => {
    const j = d.journeys.find(j => j.id === jid);
    if (j) j.steps.splice(idx, 1);
    return d;
  });
  const deleteJourney = (jid: string) => { mutate(d => { d.journeys = d.journeys.filter(j => j.id !== jid); return d; }); if (recording === jid) setRecording(null); };

  const exportPng = async () => {
    const node = canvasRef.current?.querySelector(".tree") as HTMLElement | null;
    if (!node || !docRef.current) return;
    const { toPng } = await import("html-to-image");
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#f4f6fa";
    const url = await toPng(node, { backgroundColor: bg, pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url; a.download = `${docRef.current.name.replace(/[^\w-]+/g, "_")}.png`; a.click();
  };

  const restoreVersion = (v: Doc) => mutate(d => {
    d.name = v.name; d.pages = v.pages; d.personas = v.personas ?? []; d.journeys = v.journeys ?? [];
    return d;
  });

  /* ---------- selection wrapper (recording intercepts) ---------- */
  const handleSelect = (s: Sel) => {
    if (recording && s?.pageId) { appendStep(recording, s.pageId); return; }
    setSel(s);
    if (panel === "inspector") setPanel(null);
  };

  /* ---------- render ---------- */
  const renderPage = (p: Page): React.ReactNode => {
    const kids = childrenOf.get(p.id) ?? [];
    return (
      <li key={p.id}>
        <PageCard page={p} sel={sel} setSel={handleSelect} rename={renamePage} addBlock={addBlock} addChild={addChildPage} />
        {kids.length > 0 && <ul>{kids.map(renderPage)}</ul>}
      </li>
    );
  };
  const roots = childrenOf.get(null) ?? [];
  const pillBtn = "w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)]";
  const visJourneys = doc.journeys.filter(j => visible.has(j.id));

  return (
    <div className="h-screen relative bg-[var(--bg)] text-[var(--ink)] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" ref={canvasRef}
           onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
           style={{ cursor: drag.current ? "grabbing" : "grab",
                    backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
                    backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
                    backgroundPosition: `${view.x}px ${view.y}px` }}>
        <div style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})`, transformOrigin: "0 0", width: "max-content" }}>
          <div className="tree px-10 py-8"><ul>{roots.map(renderPage)}</ul></div>
        </div>
      </div>

      <JourneyOverlay journeys={visJourneys} personas={doc.personas} deps={[view, doc, visible]} />

      {/* top-left: project identity */}
      <div className="cluster absolute top-4 left-4 z-20 flex items-center gap-2.5 pl-4 pr-3.5 py-2 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg max-w-[46vw]">
        <a href="/" title="All projects" className="flex items-center text-[var(--accent)] shrink-0"><LogoMark /></a>
        <input className="font-semibold text-[14px] bg-transparent outline-none min-w-0 w-[220px]" value={doc.name}
               onChange={e => mutate(d => { d.name = e.target.value; return d; })} />
        <span className={`shrink-0 w-2 h-2 rounded-full ${status === "saved" ? "bg-emerald-400" : status === "saving" || status === "editing" ? "bg-amber-400" : "bg-red-400"}`}
              title={`${status} · last edit ${doc.updatedBy}`} />
      </div>

      {/* top-right: people & theme */}
      <div className="cluster absolute top-4 right-4 z-20 flex items-center gap-2 px-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold" title="You">{(me || "??").slice(0, 2).toUpperCase()}</span>
        <input className="tk border border-[var(--border)] rounded-full px-3 py-1 w-24 bg-transparent text-[11px] hidden sm:block" value={me} placeholder="your name" onChange={e => changeMe(e.target.value)} />
        <ThemeToggle />
      </div>

      {/* recording banner */}
      {recJourney && (
        <div className="cluster absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pl-4 pr-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-red-500/60 rounded-full shadow-lg">
          <span className="text-red-500 animate-pulse">{ICONS.rec}</span>
          <span className="text-[12.5px]">Recording <b>{recJourney.name}</b> — click pages in order</span>
          <button className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[12px]" onClick={() => setRecording(null)}>Done</button>
        </div>
      )}

      {/* bottom-center: tools */}
      <div className="cluster absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
        <button className={pillBtn} onClick={undo} title="Undo (Cmd/Ctrl+Z)">{ICONS.undo}</button>
        <button className={pillBtn} onClick={redo} title="Redo (Cmd/Ctrl+Shift+Z)">{ICONS.redo}</button>
        <span className="w-px h-5 bg-[var(--border)]" />
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]" onClick={() => addChildPage(null)} title="Add top-level page">
          {ICONS.plus}<span className="hidden sm:inline">Page</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]" onClick={exportPng} title="Export PNG">
          {ICONS.export}<span className="hidden sm:inline">Export</span>
        </button>
        <span className="w-px h-5 bg-[var(--border)]" />
        <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${panel === "journeys" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--hover)]"}`}
                onClick={() => setPanel(panel === "journeys" ? null : "journeys")} title="Personas & journeys">
          {ICONS.route}<span className="hidden sm:inline">Journeys</span>
        </button>
        <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${panel === "history" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--hover)]"}`}
                onClick={() => setPanel(panel === "history" ? null : "history")} title="Version history">
          {ICONS.clock}<span className="hidden sm:inline">History</span>
        </button>
      </div>

      {/* bottom-right: zoom */}
      <div className="cluster absolute bottom-4 right-4 z-20 flex items-center px-1 py-1 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
        <button className="px-3 py-1 rounded-full hover:bg-[var(--hover)] text-[12px]" onClick={() => setView({ x: 60, y: 84, k: 0.8 })}>Fit</button>
        <button className="px-2.5 py-1 rounded-full hover:bg-[var(--hover)]" onClick={() => setView(v => ({ ...v, k: Math.max(0.25, v.k * 0.9) }))}>−</button>
        <span className="tk w-11 text-center text-[11px] tabular-nums">{Math.round(view.k * 100)}%</span>
        <button className="px-2.5 py-1 rounded-full hover:bg-[var(--hover)]" onClick={() => setView(v => ({ ...v, k: Math.min(2, v.k * 1.1) }))}>+</button>
      </div>

      {/* floating per-element toolbar */}
      {selPage && !detailPage && !recording && (
        <FloatingToolbar targetId={selBlock ? `blk-${selBlock.id}` : `page-${selPage.id}`} deps={[view, doc, sel]}>
          {selBlock ? (
            <>
              <button className={pillBtn} title="Move up" onClick={() => moveBlock(selPage.id, selBlock.id, -1)}>{ICONS.up}</button>
              <button className={pillBtn} title="Move down" onClick={() => moveBlock(selPage.id, selBlock.id, 1)}>{ICONS.down}</button>
              <button className={pillBtn} title="Cycle colour" onClick={() => cycleColor(selPage.id, selBlock.id)}>
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: COLOR_STYLES[selBlock.color].bg }} />
              </button>
              <button className={pillBtn} title="Duplicate" onClick={() => duplicateBlock(selPage.id, selBlock.id)}>{ICONS.dup}</button>
              <button className={pillBtn} title="Edit notes & wireframe" onClick={() => setPanel("inspector")}>{ICONS.edit}</button>
              <span className="w-px h-5 bg-[var(--border)] mx-0.5" />
              <button className={`${pillBtn} hover:text-red-500`} title="Delete block" onClick={() => deleteBlock(selPage.id, selBlock.id)}>{ICONS.trash}</button>
            </>
          ) : (
            <>
              <button className={pillBtn} title="Add block" onClick={() => addBlock(selPage.id)}>{ICONS.plus}</button>
              <button className={pillBtn} title="Add child page" onClick={() => addChildPage(selPage.id)}>{ICONS.page}</button>
              <button className={pillBtn} title="Page detail & copy" onClick={() => setDetailPageId(selPage.id)}>{ICONS.detail}</button>
              <button className={pillBtn} title="Edit page note" onClick={() => setPanel("inspector")}>{ICONS.edit}</button>
              <span className="w-px h-5 bg-[var(--border)] mx-0.5" />
              <button className={`${pillBtn} hover:text-red-500`} title="Delete page and children"
                      onClick={() => { if (confirm(`Delete "${selPage.name}" and its children?`)) deletePage(selPage.id); }}>{ICONS.trash}</button>
            </>
          )}
        </FloatingToolbar>
      )}

      {panel === "inspector" && selPage && (
        <Inspector page={selPage} block={selBlock} me={me}
          close={() => setPanel(null)}
          setPageNote={setPageNote}
          patchBlock={patchBlock} addComment={addComment} />
      )}
      {panel === "history" && (
        <HistoryPanel projectId={projectId} me={me} close={() => setPanel(null)} restore={restoreVersion} />
      )}
      {panel === "journeys" && (
        <JourneysPanel doc={doc} visible={visible} setVisible={setVisible}
          recording={recording} setRecording={setRecording}
          addPersona={addPersona} deletePersona={deletePersona}
          addJourney={addJourney} removeStep={removeStep} deleteJourney={deleteJourney}
          close={() => setPanel(null)} />
      )}

      {detailPage && <DetailModal page={detailPage} onClose={() => setDetailPageId(null)} />}
    </div>
  );
}

/* ---------- journey overlay ---------- */
type Seg = { d: string; color: string };
type Badge = { x: number; y: number; n: number; color: string };
function JourneyOverlay({ journeys, personas, deps }: { journeys: Journey[]; personas: Persona[]; deps: unknown[] }) {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  useLayoutEffect(() => {
    const S: Seg[] = [];
    const B: Badge[] = [];
    journeys.forEach((j, ji) => {
      const color = personas.find(p => p.id === j.personaId)?.color ?? "#8b5cf6";
      const lane = (ji - (journeys.length - 1) / 2) * 14;
      const rects = j.steps.map(pid => document.getElementById(`page-${pid}`)?.getBoundingClientRect() ?? null);
      rects.forEach((r, i) => {
        if (!r) return;
        B.push({ x: r.left + 14 + ji * 20, y: r.top, n: i + 1, color });
        const nr = rects[i + 1];
        if (!nr) return;
        const ax = r.left + r.width / 2 + lane, ay = r.bottom;
        const bx = nr.left + nr.width / 2 + lane, by = nr.top;
        const dy = Math.max(40, Math.min(120, Math.abs(by - ay) / 2));
        S.push({ d: `M ${ax} ${ay} C ${ax} ${ay + dy}, ${bx} ${by - dy}, ${bx} ${by}`, color });
      });
    });
    setSegs(S); setBadges(B);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  if (!segs.length && !badges.length) return null;
  return (
    <svg className="fixed inset-0 z-10 pointer-events-none" width="100%" height="100%">
      {segs.map((s, i) => (
        <g key={i}>
          <path d={s.d} stroke={s.color} strokeWidth="2.5" fill="none" strokeDasharray="7 5" opacity="0.9" />
        </g>
      ))}
      {badges.map((b, i) => (
        <g key={"b" + i}>
          <circle cx={b.x} cy={b.y} r="9" fill={b.color} />
          <text x={b.x} y={b.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{b.n}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- floating toolbar anchored to a canvas element ---------- */
function FloatingToolbar({ targetId, deps, children }: { targetId: string; deps: unknown[]; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) { setPos(null); return; }
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, ...deps]);
  if (!pos) return null;
  return (
    <div className="toolbar fixed z-30 flex items-center gap-0.5 px-1.5 py-1 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-xl"
         style={{ left: pos.x, top: Math.max(70, pos.y - 8), transform: "translate(-50%,-100%)" }}>
      {children}
    </div>
  );
}

/* ---------- page card on canvas ---------- */
function PageCard({ page, sel, setSel, rename, addBlock, addChild }: {
  page: Page; sel: Sel; setSel: (s: Sel) => void;
  rename: (pid: string, name: string) => void;
  addBlock: (pid: string) => void; addChild: (pid: string) => void;
}) {
  const active = sel?.pageId === page.id && !sel?.blockId;
  return (
    <div id={`page-${page.id}`}
         className={`card w-[230px] rounded-xl bg-[var(--card)] border-2 ${page.external ? "border-dashed border-[var(--muted)]" : active ? "border-[var(--accent)]" : "border-[var(--card-border)]"} shadow-sm`}
         onClick={e => { e.stopPropagation(); if (!(e.target as HTMLElement).closest(".blk,button,input")) setSel({ pageId: page.id }); }}>
      <div className="flex items-center gap-1 px-2 pt-1.5">
        <input className="w-full text-center font-bold text-[12.5px] text-[var(--accent)] outline-none bg-transparent"
               value={page.name} onChange={e => rename(page.id, e.target.value)}
               onFocus={() => setSel({ pageId: page.id })} onClick={e => e.stopPropagation()} />
      </div>
      <div className="p-1.5 pt-1 flex flex-col gap-1">
        {page.blocks.map(b => {
          const c = COLOR_STYLES[b.color];
          const on = sel?.pageId === page.id && sel?.blockId === b.id;
          return (
            <div key={b.id} id={`blk-${b.id}`}
                 className={`blk rounded px-1.5 pt-1 pb-0.5 cursor-pointer ${on ? "ring-2 ring-[var(--accent)]" : ""}`}
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
          <button className="flex-1 text-[10.5px] text-[var(--muted)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] rounded-full py-0.5"
                  onClick={e => { e.stopPropagation(); addBlock(page.id); }}>+ block</button>
          <button className="flex-1 text-[10.5px] text-[var(--muted)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] rounded-full py-0.5"
                  title="Add a child page below this one"
                  onClick={e => { e.stopPropagation(); addChild(page.id); }}>+ page</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- read & copy detail modal ---------- */
function DetailModal({ page, onClose }: { page: Page; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="panel w-full max-w-5xl max-h-[90vh] rounded-3xl bg-[var(--panel)] backdrop-blur-2xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
          <span className="text-[var(--accent)]"><LogoMark size={16} /></span>
          <h2 className="text-lg font-bold text-[var(--accent)] truncate">{page.name}</h2>
          <div className="ml-auto flex items-center gap-2">
            <CopyBtn text={pageToText(page)} label="Copy page" />
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)]" onClick={onClose}>{ICONS.close}</button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {page.note && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-[15px] text-[var(--ink)]">About this page</h3>
                  <CopyBtn text={page.note} />
                </div>
                <p className="text-[13.5px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap">{page.note}</p>
              </div>
            )}
            {page.blocks.map(b => (
              <div key={b.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-[15px]" style={{ color: COLOR_STYLES[b.color].bg }}>{b.label}</h3>
                  <CopyBtn text={[b.label, b.note, b.component && `Component: ${b.component}`, b.flag && `FLAG: ${b.flag}`].filter(Boolean).join("\n")} />
                </div>
                {b.note && <p className="text-[13.5px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap mb-2">{b.note}</p>}
                {b.component && <p className="tk text-[11px] text-[var(--muted)]">{b.component}</p>}
                {b.flag && <p className="text-[13px] text-red-500 font-medium mt-2">{b.flag}</p>}
                {b.comments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {b.comments.map(c => (
                      <div key={c.id} className="text-[12.5px] bg-[var(--hover)] rounded-lg px-3 py-1.5">
                        <span className="tk text-[10px] text-[var(--muted)] mr-2">{c.author}</span>{c.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="w-[240px] shrink-0 border-l border-[var(--border)] overflow-y-auto p-4">
            <div className="rounded-xl bg-[var(--card)] border-2 border-[var(--card-border)] overflow-hidden">
              <div className="text-center font-bold text-[12px] text-[var(--accent)] py-1.5">{page.name}</div>
              <div className="p-1.5 pt-0 flex flex-col gap-1">
                {page.blocks.map(b => {
                  const c = COLOR_STYLES[b.color];
                  return (
                    <div key={b.id} className="rounded px-1.5 pt-1 pb-0.5" style={{ background: c.bg, color: c.fg }}>
                      <div className="text-[10px] font-semibold truncate">{b.label}</div>
                      <Glyph id={b.glyph} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- version history panel ---------- */
type VMeta = { vid: string; name: string; rev: number; createdAt: number; createdBy: string };
function HistoryPanel({ projectId, me, close, restore }: {
  projectId: string; me: string; close: () => void; restore: (doc: Doc) => void;
}) {
  const [list, setList] = useState<VMeta[] | null>(null);
  const [name, setName] = useState("");
  const load = useCallback(() => {
    fetch(`/api/versions?id=${projectId}`).then(r => r.json()).then(j => setList(j.versions ?? []));
  }, [projectId]);
  useEffect(() => { load(); }, [load]);
  const snapshot = async () => {
    await fetch("/api/versions", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, name: name.trim() || "snapshot", by: me }) });
    setName(""); load();
  };
  const doRestore = async (v: VMeta) => {
    if (!confirm(`Restore "${v.name}" from ${new Date(v.createdAt).toLocaleString()}? Current state stays in history and this is undoable.`)) return;
    const j = await fetch(`/api/versions?id=${projectId}&vid=${v.vid}`).then(r => r.json());
    if (j.doc) restore(j.doc);
  };
  return (
    <aside className="panel absolute top-[68px] right-4 bottom-4 w-[340px] bg-[var(--panel)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden z-30">
      <div className="flex items-center px-4 py-2.5 border-b border-[var(--border)]">
        <div className="text-sm font-bold text-[var(--accent)]">Version history</div>
        <button className="ml-auto text-[var(--muted)] hover:text-[var(--ink)]" onClick={close}>{ICONS.close}</button>
      </div>
      <div className="p-3 border-b border-[var(--border)] flex gap-1.5">
        <input className="flex-1 border border-[var(--border)] rounded-full px-3 py-1.5 bg-transparent text-[12.5px]" placeholder="Name this version…"
               value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && snapshot()} />
        <button className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-white text-[12px]" onClick={snapshot}>Save</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!list && <p className="text-[12px] text-[var(--muted)] px-1">Loading…</p>}
        {list && list.length === 0 && <p className="text-[12px] text-[var(--muted)] px-1">No versions yet. One is saved automatically every ~10 minutes of editing, or save one now.</p>}
        {list && list.map(v => (
          <div key={v.vid} className="border border-[var(--border)] rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold truncate">{v.name === "auto" ? "Auto snapshot" : v.name}</div>
              <div className="tk text-[10px] text-[var(--muted)]">{v.createdBy} · {new Date(v.createdAt).toLocaleString()} · rev {v.rev}</div>
            </div>
            <button className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] hover:bg-[var(--hover)] shrink-0" onClick={() => doRestore(v)}>Restore</button>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ---------- personas & journeys panel ---------- */
function JourneysPanel({ doc, visible, setVisible, recording, setRecording, addPersona, deletePersona, addJourney, removeStep, deleteJourney, close }: {
  doc: Doc; visible: Set<string>; setVisible: (s: Set<string>) => void;
  recording: string | null; setRecording: (id: string | null) => void;
  addPersona: (name: string, color: string, desc: string) => void;
  deletePersona: (id: string) => void;
  addJourney: (name: string, personaId: string) => void;
  removeStep: (jid: string, idx: number) => void;
  deleteJourney: (jid: string) => void;
  close: () => void;
}) {
  const [pName, setPName] = useState("");
  const [pColor, setPColor] = useState(PERSONA_COLORS[0]);
  const [jName, setJName] = useState("");
  const [jPersona, setJPersona] = useState("");
  const pageName = (pid: string) => doc.pages.find(p => p.id === pid)?.name ?? "(deleted)";
  const toggle = (jid: string) => {
    const next = new Set(visible);
    if (next.has(jid)) next.delete(jid); else next.add(jid);
    setVisible(next);
  };
  return (
    <aside className="panel absolute top-[68px] right-4 bottom-4 w-[360px] bg-[var(--panel)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden z-30">
      <div className="flex items-center px-4 py-2.5 border-b border-[var(--border)]">
        <div className="text-sm font-bold text-[var(--accent)]">Personas & journeys</div>
        <button className="ml-auto text-[var(--muted)] hover:text-[var(--ink)]" onClick={close}>{ICONS.close}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[13px]">
        <div>
          <div className="tk text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Personas</div>
          <div className="space-y-1.5 mb-2">
            {doc.personas.map(p => (
              <div key={p.id} className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-1.5" title={p.desc}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                <button className="text-[var(--muted)] hover:text-red-500" title="Delete persona and its journeys"
                        onClick={() => { if (confirm(`Delete persona "${p.name}" and its journeys?`)) deletePersona(p.id); }}>{ICONS.trash}</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input className="flex-1 border border-[var(--border)] rounded-full px-3 py-1.5 bg-transparent text-[12.5px]" placeholder="New persona…"
                   value={pName} onChange={e => setPName(e.target.value)} />
            <div className="flex gap-1">
              {PERSONA_COLORS.map(c => (
                <button key={c} className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full ${pColor === c ? "ring-2 ring-offset-1 ring-[var(--accent)] ring-offset-[var(--card)]" : ""}`}
                        style={{ background: c }} onClick={() => setPColor(c)} />
              ))}
            </div>
            <button className="px-2.5 py-1.5 rounded-full bg-[var(--accent)] text-white text-[12px]"
                    onClick={() => { if (pName.trim()) { addPersona(pName.trim(), pColor, ""); setPName(""); } }}>Add</button>
          </div>
        </div>

        <div>
          <div className="tk text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Journeys</div>
          <div className="space-y-2 mb-3">
            {doc.journeys.map(j => {
              const per = doc.personas.find(p => p.id === j.personaId);
              return (
                <div key={j.id} className={`border rounded-xl px-3 py-2 ${recording === j.id ? "border-red-500/70" : "border-[var(--border)]"}`}>
                  <div className="flex items-center gap-2">
                    <button className="text-[var(--muted)] hover:text-[var(--ink)]" title="Show / hide on canvas" onClick={() => toggle(j.id)}>
                      {visible.has(j.id) ? ICONS.eye : ICONS.eyeOff}
                    </button>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: per?.color ?? "#888" }} />
                    <span className="flex-1 truncate font-medium">{j.name}</span>
                    <button className={`text-[11px] px-2 py-0.5 rounded-full border ${recording === j.id ? "border-red-500 text-red-500" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]"}`}
                            onClick={() => setRecording(recording === j.id ? null : j.id)}>
                      {recording === j.id ? "Stop" : "Record"}
                    </button>
                    <button className="text-[var(--muted)] hover:text-red-500" onClick={() => { if (confirm(`Delete journey "${j.name}"?`)) deleteJourney(j.id); }}>{ICONS.trash}</button>
                  </div>
                  {j.steps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {j.steps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10.5px] bg-[var(--hover)] border border-[var(--border)] rounded-full pl-2 pr-1 py-0.5">
                          <b>{i + 1}</b> {pageName(s)}
                          <button className="text-[var(--muted)] hover:text-red-500 px-0.5" onClick={() => removeStep(j.id, i)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {j.steps.length === 0 && <p className="tk text-[10px] text-[var(--muted)] mt-1.5">No steps yet. Record, then click pages in order.</p>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <input className="flex-1 min-w-0 border border-[var(--border)] rounded-full px-3 py-1.5 bg-transparent text-[12.5px]" placeholder="New journey…"
                   value={jName} onChange={e => setJName(e.target.value)} />
            <select className="border border-[var(--border)] rounded-full px-2 py-1.5 bg-transparent text-[12px] max-w-[110px]"
                    value={jPersona} onChange={e => setJPersona(e.target.value)}>
              <option value="">persona…</option>
              {doc.personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="px-2.5 py-1.5 rounded-full bg-[var(--accent)] text-white text-[12px] shrink-0"
                    onClick={() => { if (jName.trim() && jPersona) { addJourney(jName.trim(), jPersona); setJName(""); } }}>Start</button>
          </div>
          <p className="tk text-[10px] text-[var(--muted)] mt-2">Starting a journey begins recording: click pages on the canvas in order, then Done.</p>
        </div>
      </div>
    </aside>
  );
}

/* ---------- edit inspector ---------- */
function Inspector({ page, block, me, close, setPageNote, patchBlock, addComment }: {
  page: Page; block: Block | null; me: string; close: () => void;
  setPageNote: (pid: string, n: string) => void;
  patchBlock: (pid: string, bid: string, patch: Partial<Block>) => void;
  addComment: (pid: string, bid: string, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <aside className="panel absolute top-[68px] right-4 bottom-4 w-[360px] bg-[var(--panel)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden z-30">
      <div className="flex items-center px-4 py-2.5 border-b border-[var(--border)]">
        <div className="text-sm font-bold text-[var(--accent)] truncate">{page.name}{block ? ` · ${block.label}` : ""}</div>
        <button className="ml-auto text-[var(--muted)] hover:text-[var(--ink)]" onClick={close}>{ICONS.close}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px]">
        {!block && (
          <Field label="Page note">
            <textarea className="w-full border border-[var(--border)] rounded-lg p-2 min-h-[220px] bg-transparent" value={page.note}
                      onChange={e => setPageNote(page.id, e.target.value)} />
          </Field>
        )}
        {block && (
          <>
            <Field label="Label">
              <input className="w-full border border-[var(--border)] rounded-lg p-2 bg-transparent" value={block.label}
                     onChange={e => patchBlock(page.id, block.id, { label: e.target.value })} />
            </Field>
            <Field label="Wireframe">
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(GLYPHS) as GlyphId[]).map(g => (
                  <button key={g} title={GLYPHS[g].name}
                          className={`border rounded-lg p-1 text-[var(--accent)] ${block.glyph === g ? "border-[var(--accent)] bg-[var(--hover)]" : "border-[var(--border)]"}`}
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
                          className={`w-7 h-7 rounded-full ${block.color === c ? "ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--card)]" : ""}`}
                          style={{ background: COLOR_STYLES[c].bg }}
                          onClick={() => patchBlock(page.id, block.id, { color: c })} />
                ))}
              </div>
            </Field>
            <Field label="Component">
              <input className="w-full border border-[var(--border)] rounded-lg p-2 bg-transparent" placeholder="AEM: Promotional Banner"
                     value={block.component} onChange={e => patchBlock(page.id, block.id, { component: e.target.value })} />
            </Field>
            <Field label="Note (purpose, user needs, content status)">
              <textarea className="w-full border border-[var(--border)] rounded-lg p-2 min-h-[120px] bg-transparent" value={block.note}
                        onChange={e => patchBlock(page.id, block.id, { note: e.target.value })} />
            </Field>
            <Field label="Red flag (custom component or pending decision)">
              <textarea className="w-full border border-[var(--border)] rounded-lg p-2 min-h-[52px] bg-transparent text-red-500" value={block.flag}
                        onChange={e => patchBlock(page.id, block.id, { flag: e.target.value })} />
            </Field>
            <Field label={`Comments (${block.comments.length})`}>
              <div className="space-y-2">
                {block.comments.map(c => (
                  <div key={c.id} className="bg-[var(--hover)] border border-[var(--border)] rounded-lg p-2">
                    <div className="tk text-[10px] text-[var(--muted)]">{c.author} · {new Date(c.at).toLocaleString()}</div>
                    <div>{c.text}</div>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <input className="flex-1 border border-[var(--border)] rounded-full px-3 p-2 bg-transparent" placeholder={`Comment as ${me}…`} value={draft}
                         onChange={e => setDraft(e.target.value)}
                         onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { addComment(page.id, block.id, draft.trim()); setDraft(""); } }} />
                  <button className="px-3 border border-[var(--border)] rounded-full hover:bg-[var(--hover)]" onClick={() => { if (draft.trim()) { addComment(page.id, block.id, draft.trim()); setDraft(""); } }}>Add</button>
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
      <div className="tk text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">{label}</div>
      {children}
    </div>
  );
}
