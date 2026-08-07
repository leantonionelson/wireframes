"use client";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { COLOR_STYLES, CHROME_ROLES, PERSONA_COLORS, blockStyle, readableOn, normDoc, type Block, type ColorRole, type Doc, type GlyphId, type Journey, type Page, type Persona, type PinNote, blankBlock, uid } from "@/lib/model";
import { GLYPHS, Glyph } from "@/lib/glyphs";
import { LogoMark, ScaffoldingLoader, SCAFFOLD_CYCLE_MS, ThemeToggle } from "@/components/Theme";
import { LoginModal, logout, useAuth } from "@/components/Auth";

type Sel = { pageId: string; blockId?: string } | null;
type Snap = Pick<Doc, "name" | "pages" | "personas" | "journeys" | "notes">;
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
  const [active, setActive] = useState<string | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const [wsTab, setWsTab] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("loading");
  const [me, setMe] = useState("");
  const [notesMode, setNotesMode] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const auth = useAuth();
  const canEdit = auth.canEdit;
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const docRef = useRef<Doc | null>(null);
  docRef.current = doc;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const annPending = useRef(0); // in-flight or debounced annotation ops; poll waits for them
  const history = useRef<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });

  // Hold the loader for at least one full animation cycle, so a fast load
  // does not flash a half-built mark.
  const [cycleDone, setCycleDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCycleDone(true), SCAFFOLD_CYCLE_MS);
    return () => clearTimeout(t);
  }, []);

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
      if (!d || dirtyRef.current || annPending.current > 0) return;
      const r = await fetch(`/api/doc?id=${projectId}&since=${d.rev}`).then(r => r.json());
      if (!stop && !r.unchanged && r.doc) setDoc(normDoc(r.doc));
    }, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [projectId]);

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

  const snapOf = (d: Doc): Snap => structuredClone({ name: d.name, pages: d.pages, personas: d.personas, journeys: d.journeys, notes: d.notes });
  const mutate = useCallback((fn: (d: Doc) => Doc) => {
    if (!canEditRef.current) return;
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
    if (!canEditRef.current) return;
    const cur = docRef.current;
    const s = history.current.past.pop();
    if (!cur || !s) return;
    history.current.future.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  const redo = useCallback(() => {
    if (!canEditRef.current) return;
    const cur = docRef.current;
    const s = history.current.future.pop();
    if (!cur || !s) return;
    history.current.past.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  /* annotation transport: pinned notes & comments are open to viewers, so
     they go through /api/annotate (server-side merge) rather than the gated
     doc PUT. Local echo first, server response adopted when we are not dirty.
     These hooks must sit above the loading early-return with the others. */
  const applyLocal = (fn: (d: Doc) => Doc) => setDoc(prev => (prev ? fn(structuredClone(prev)) : prev));
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sendAnnotate = useCallback(async (payload: Record<string, unknown>) => {
    annPending.current++;
    try {
      const r = await fetch("/api/annotate", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, ...payload }) });
      const j = await r.json();
      if (r.ok && j.doc && !dirtyRef.current) setDoc(normDoc(j.doc));
    } finally { annPending.current--; }
  }, [projectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === "Escape") { setDetailPageId(null); setPanel(null); setSel(null); setRecording(null); setWsOpen(false); setNotesMode(false); setOpenNote(null); }
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
    // cycleDone matters: the canvas is not mounted until the loader clears, so
    // without it the listener is attached to nothing and scrolling stays dead.
  }, [doc ? 1 : 0, cycleDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Page[]>();
    (doc?.pages ?? []).forEach(p => {
      const arr = m.get(p.parentId) ?? [];
      arr.push(p); m.set(p.parentId, arr);
    });
    m.forEach(a => a.sort((x, y) => x.order - y.order));
    return m;
  }, [doc]);

  if (!doc || !cycleDone) {
    // Only call it missing once the doc has actually come back empty.
    if (status === "not found" && cycleDone) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[var(--bg)] text-[var(--ink)]">
          <span className="text-[var(--muted)]"><LogoMark size={34} /></span>
          <p className="text-[14px] font-semibold">No scaffold here</p>
          <p className="text-[12.5px] text-[var(--muted)]">This project does not exist, or the link is wrong.</p>
          <a href="/" className="mt-1 px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-[12.5px]">All projects</a>
        </div>
      );
    }
    return <ScaffoldingLoader />;
  }

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
      d.journeys.forEach(j => { j.steps = j.steps.filter(s => !doomed.has(s.pageId)); });
      d.notes = d.notes.filter(n => !doomed.has(n.pageId));
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
  const deleteBlock = (pid: string, bid: string) => { mutate(d => { const p = d.pages.find(p => p.id === pid)!; p.blocks = p.blocks.filter(b => b.id !== bid); d.notes = d.notes.filter(n => n.blockId !== bid); return d; }); setSel({ pageId: pid }); };
  const addComment = (pid: string, bid: string, text: string) => {
    const comment = { id: uid(), author: me || "anon", text, at: Date.now() };
    applyLocal(d => { d.pages.find(p => p.id === pid)?.blocks.find(b => b.id === bid)?.comments.push(comment); return d; });
    sendAnnotate({ op: "comment-add", pageId: pid, blockId: bid, comment });
  };

  /* journeys */
  const addPersona = (name: string, color: string, desc: string) =>
    mutate(d => { d.personas.push({ id: uid(), name, color, desc }); return d; });
  const patchPersona = (perId: string, patch: Partial<Pick<Persona, "name" | "color" | "desc">>) =>
    mutate(d => { const p = d.personas.find(p => p.id === perId); if (p) Object.assign(p, patch); return d; });
  const deletePersona = (perId: string) => mutate(d => {
    d.personas = d.personas.filter(p => p.id !== perId);
    d.journeys = d.journeys.filter(j => j.personaId !== perId);
    return d;
  });
  const addJourney = (name: string, personaId: string): string => {
    const jid = uid();
    mutate(d => { d.journeys.push({ id: jid, personaId, name, goal: "", entry: "", exit: "", steps: [] }); return d; });
    setActive(jid);
    return jid;
  };
  const appendStep = (jid: string, pageId: string) => mutate(d => {
    const j = d.journeys.find(j => j.id === jid);
    if (j && j.steps[j.steps.length - 1]?.pageId !== pageId) j.steps.push({ pageId, note: "" });
    return d;
  });
  const patchStep = (jid: string, idx: number, note: string) => mutate(d => {
    const j = d.journeys.find(j => j.id === jid);
    if (j && j.steps[idx]) j.steps[idx].note = note;
    return d;
  });
  const patchJourney = (jid: string, patch: Partial<Pick<Journey, "name" | "goal" | "entry" | "exit">>) =>
    mutate(d => { const j = d.journeys.find(j => j.id === jid); if (j) Object.assign(j, patch); return d; });
  const removeStep = (jid: string, idx: number) => mutate(d => {
    const j = d.journeys.find(j => j.id === jid);
    if (j) j.steps.splice(idx, 1);
    return d;
  });
  const deleteJourney = (jid: string) => { mutate(d => { d.journeys = d.journeys.filter(j => j.id !== jid); return d; }); if (recording === jid) setRecording(null); if (active === jid) setActive(null); };

  const addNote = (pageId: string, blockId: string | undefined, fx: number, fy: number) => {
    const note: PinNote = { id: uid(), pageId, blockId, fx, fy, text: "", author: me || "anon", at: Date.now() };
    applyLocal(d => { d.notes.push(note); return d; });
    setOpenNote(note.id);
    sendAnnotate({ op: "note-add", note });
  };
  const patchNote = (nid: string, text: string) => {
    applyLocal(d => { const n = d.notes.find(n => n.id === nid); if (n) n.text = text; return d; });
    if (noteTimers.current[nid]) clearTimeout(noteTimers.current[nid]); else annPending.current++;
    noteTimers.current[nid] = setTimeout(() => {
      delete noteTimers.current[nid];
      annPending.current--;
      const n = docRef.current?.notes.find(n => n.id === nid);
      if (n) sendAnnotate({ op: "note-patch", id: nid, text: n.text, author: me || "anon" });
    }, 600);
  };
  const deleteNote = (nid: string) => {
    applyLocal(d => { d.notes = d.notes.filter(n => n.id !== nid); return d; });
    setOpenNote(null);
    sendAnnotate({ op: "note-delete", id: nid, author: me || "anon" });
  };

  // In notes mode a transparent catcher sits over the canvas; find what the
  // click landed on underneath it and anchor to the block first, page second.
  const placePin = (e: React.MouseEvent) => {
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    const anchor = (els.find(el => el.id?.startsWith("blk-")) ?? els.find(el => el.id?.startsWith("page-"))) as HTMLElement | undefined;
    if (!anchor) { setOpenNote(null); return; } // empty canvas: close any open note, stay in notes mode
    const r = anchor.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const isBlk = anchor.id.startsWith("blk-");
    const pageId = isBlk
      ? docRef.current?.pages.find(p => p.blocks.some(b => `blk-${b.id}` === anchor.id))?.id
      : anchor.id.slice(5);
    if (!pageId) return;
    addNote(pageId, isBlk ? anchor.id.slice(4) : undefined, fx, fy);
  };

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
        <PageCard page={p} sel={sel} setSel={handleSelect} rename={renamePage} addBlock={addBlock} addChild={addChildPage} personas={doc.personas} canEdit={canEdit} />
        {kids.length > 0 && <ul>{kids.map(renderPage)}</ul>}
      </li>
    );
  };
  const roots = childrenOf.get(null) ?? [];
  const pillBtn = "w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)]";
  const activeJourney = doc.journeys.find(j => j.id === active) ?? null;

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

      {activeJourney && <JourneyOverlay journey={activeJourney} personas={doc.personas} deps={[view, doc, active]} />}

      {/* pinned notes: markers and placement live in notes mode, open to everyone */}
      {notesMode && (
        <NotesLayer notes={doc.notes} openId={openNote} setOpenId={setOpenNote} canEdit={canEdit} me={me}
                    patchNote={patchNote} deleteNote={deleteNote} deps={[view, doc, openNote]} />
      )}
      {notesMode && <div className="fixed inset-0 z-[19] cursor-crosshair" onClick={placePin} />}
      {notesMode && (
        <div className="cluster absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pl-4 pr-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-amber-500/60 rounded-full shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[12.5px]">Notes: click a page or block to pin one, click a marker to read it</span>
          <button className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[12px]" onClick={() => setNotesMode(false)}>Done</button>
        </div>
      )}

      {/* top-left: project identity */}
      <div className="cluster absolute top-4 left-4 z-20 flex items-center gap-2.5 pl-4 pr-3.5 py-2 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg max-w-[46vw]">
        <a href="/" title="All projects" className="flex items-center text-[var(--accent)] shrink-0"><LogoMark /></a>
        <input className="font-semibold text-[14px] bg-transparent outline-none min-w-0 w-[220px]" value={doc.name} readOnly={!canEdit}
               onChange={e => mutate(d => { d.name = e.target.value; return d; })} />
        <span className={`shrink-0 w-2 h-2 rounded-full ${status === "saved" ? "bg-emerald-400" : status === "saving" || status === "editing" ? "bg-amber-400" : "bg-red-400"}`}
              title={`${status} · last edit ${doc.updatedBy}`} />
      </div>

      {/* top-right: people & theme */}
      <div className="cluster absolute top-4 right-4 z-20 flex items-center gap-2 px-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
        {auth.enabled && !auth.authed && (
          <button className="flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full border border-[var(--border)] text-[11.5px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)]"
                  onClick={() => setLoginOpen(true)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            View only · Log in
          </button>
        )}
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold" title="You">{(me || "??").slice(0, 2).toUpperCase()}</span>
        <input className="tk border border-[var(--border)] rounded-full px-3 py-1 w-24 bg-transparent text-[11px] hidden sm:block" value={me} placeholder="your name" onChange={e => changeMe(e.target.value)} />
        {auth.enabled && auth.authed && (
          <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)]" title="Log out"
                  onClick={async () => { await logout(); auth.refresh(); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        )}
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
        {canEdit && (
          <>
            <button className={pillBtn} onClick={undo} title="Undo (Cmd/Ctrl+Z)">{ICONS.undo}</button>
            <button className={pillBtn} onClick={redo} title="Redo (Cmd/Ctrl+Shift+Z)">{ICONS.redo}</button>
            <span className="w-px h-5 bg-[var(--border)]" />
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]" onClick={() => addChildPage(null)} title="Add top-level page">
              {ICONS.plus}<span className="hidden sm:inline">Page</span>
            </button>
          </>
        )}
        <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${notesMode ? "bg-amber-400 text-amber-950" : "hover:bg-[var(--hover)]"}`}
                onClick={() => { setNotesMode(m => !m); setOpenNote(null); }}
                title="Notes: see pinned notes and add your own">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5M9 4h6l1 7 2 2H6l2-2 1-7z"/></svg>
          <span className="hidden sm:inline">Notes{doc.notes.length > 0 ? ` · ${doc.notes.length}` : ""}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]" onClick={exportPng} title="Export PNG">
          {ICONS.export}<span className="hidden sm:inline">Export</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]"
                title="Copy link — anyone with it can view, editing needs the password"
                onClick={async () => { await navigator.clipboard.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 1500); }}>
          {shared ? ICONS.check : ICONS.copy}<span className="hidden sm:inline">{shared ? "Copied" : "Share"}</span>
        </button>
        <span className="w-px h-5 bg-[var(--border)]" />
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] hover:bg-[var(--hover)]"
                onClick={() => { setWsOpen(true); setWsTab(t => t ?? (docRef.current?.personas[0]?.id ?? null)); }} title="User journeys">
          {ICONS.route}<span className="hidden sm:inline">User journeys</span>
        </button>
        {canEdit && (
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${panel === "history" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--hover)]"}`}
                  onClick={() => setPanel(panel === "history" ? null : "history")} title="Version history">
            {ICONS.clock}<span className="hidden sm:inline">History</span>
          </button>
        )}
      </div>

      {/* bottom-right: intent legend, sits above the zoom cluster.
          Each intent opens User journeys on its own tab. */}
      {doc.personas.length > 0 && (
        <div className="cluster absolute bottom-16 right-4 z-20 flex flex-col items-stretch gap-0.5 p-1 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-lg">
          <span className="text-[9px] uppercase tracking-wide text-[var(--muted)] px-2 pt-0.5 pb-1">Intent</span>
          {doc.personas.map(p => (
            <button key={p.id}
                    title={`Open user journeys: ${p.name}`}
                    onClick={() => { setWsTab(p.id); setWsOpen(true); }}
                    className="flex items-center gap-1.5 text-[11px] rounded-full pl-1.5 pr-2.5 py-1 hover:bg-[var(--hover)] text-[var(--ink)] text-left">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}

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
          {!canEdit ? (
            <button className={pillBtn} title="Page detail & copy" onClick={() => setDetailPageId(selPage.id)}>{ICONS.detail}</button>
          ) : selBlock ? (
            <>
              <button className={pillBtn} title="Move up" onClick={() => moveBlock(selPage.id, selBlock.id, -1)}>{ICONS.up}</button>
              <button className={pillBtn} title="Move down" onClick={() => moveBlock(selPage.id, selBlock.id, 1)}>{ICONS.down}</button>
              <button className={pillBtn} title="Cycle colour" onClick={() => cycleColor(selPage.id, selBlock.id)}>
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: blockStyle(selBlock, doc.personas).bg }} />
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
        <Inspector page={selPage} block={selBlock} me={me} personas={doc.personas}
          close={() => setPanel(null)}
          setPageNote={setPageNote}
          patchBlock={patchBlock} addComment={addComment} />
      )}
      {panel === "history" && (
        <HistoryPanel projectId={projectId} me={me} close={() => setPanel(null)} restore={restoreVersion} />
      )}


      {detailPage && <DetailModal page={detailPage} personas={doc.personas} me={me} canEdit={canEdit} addComment={addComment} setPageNote={setPageNote} patchBlock={patchBlock} addBlk={() => addBlock(detailPage.id)} onClose={() => setDetailPageId(null)} />}
      {wsOpen && <UserJourneysModal doc={doc} tab={wsTab} setTab={setWsTab} canEdit={canEdit}
        patchPersona={patchPersona} addPersona={addPersona} deletePersona={deletePersona}
        patchJourney={patchJourney} patchStep={patchStep} addStep={appendStep} removeStep={removeStep}
        addJourney={addJourney} deleteJourney={deleteJourney}
        active={active} setActive={setActive}
        record={(jid) => { setRecording(jid); setWsOpen(false); }}
        onClose={() => setWsOpen(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => auth.refresh()} />}
    </div>
  );
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

/* ---------- pinned notes overlay ---------- */
function NotesLayer({ notes, openId, setOpenId, canEdit, me, patchNote, deleteNote, deps }: {
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

/* ---------- journey overlay: one trace at a time ---------- */
type Seg = { d: string; color: string };
type Badge = { x: number; y: number; n: number; color: string };
function JourneyOverlay({ journey, personas, deps }: { journey: Journey; personas: Persona[]; deps: unknown[] }) {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  useLayoutEffect(() => {
    const S: Seg[] = [];
    const B: Badge[] = [];
    const color = personas.find(p => p.id === journey.personaId)?.color ?? "#8b5cf6";
    const rects = journey.steps.map(st => document.getElementById(`page-${st.pageId}`)?.getBoundingClientRect() ?? null);
    rects.forEach((r, i) => {
      if (!r) return;
      B.push({ x: r.left + 14, y: r.top, n: i + 1, color });
      const nr = rects[i + 1];
      if (!nr) return;
      const ax = r.left + r.width / 2, ay = r.bottom;
      const bx = nr.left + nr.width / 2, by = nr.top;
      const dy = Math.max(40, Math.min(120, Math.abs(by - ay) / 2));
      S.push({ d: `M ${ax} ${ay} C ${ax} ${ay + dy}, ${bx} ${by - dy}, ${bx} ${by}`, color });
    });
    setSegs(S); setBadges(B);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  if (!segs.length && !badges.length) return null;
  return (
    <svg className="fixed inset-0 z-10 pointer-events-none" width="100%" height="100%">
      {segs.map((s, i) => <path key={i} d={s.d} stroke={s.color} strokeWidth="2.5" fill="none" strokeDasharray="7 5" opacity="0.9" />)}
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
function PageCard({ page, sel, setSel, rename, addBlock, addChild, personas, canEdit }: {
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
            <div key={b.id} id={`blk-${b.id}`}
                 className={`blk rounded px-1.5 pt-1 pb-0.5 cursor-pointer ${on ? "ring-2 ring-[var(--accent)]" : ""}`}
                 style={{ background: c.bg, color: c.fg }}
                 onClick={e => { e.stopPropagation(); setSel({ pageId: page.id, blockId: b.id }); }}>
              <div className="flex items-center gap-1 text-[10.5px] font-semibold leading-tight">
                <span className="truncate">{b.label}</span>
                {c.extra.map((col, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/50" style={{ background: col }} />
                ))}
                {b.flag && <span title={b.flag} className="ml-auto text-[9px] bg-red-600 text-white rounded px-1">!</span>}
                {b.comments.length > 0 && <span className="text-[9px] bg-white/25 rounded px-1">{b.comments.length}</span>}
              </div>
              <Glyph id={b.glyph} />
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

/* ---------- read & copy detail modal ---------- */
function DetailModal({ page, personas, me, canEdit, addComment, setPageNote, patchBlock, addBlk, onClose }: {
  page: Page;
  personas: Persona[];
  me: string;
  canEdit: boolean;
  addComment: (pid: string, bid: string, text: string) => void;
  setPageNote: (pid: string, n: string) => void;
  patchBlock: (pid: string, bid: string, patch: Partial<Block>) => void;
  addBlk: () => void;
  onClose: () => void;
}) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);
  const revealBlock = (bid: string) => {
    cardRefs.current[bid]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFocusedBlock(bid);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFocusedBlock(null), 1800);
  };
  return (
    <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="panel w-full max-w-5xl max-h-[90vh] rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
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
            {page.blocks.map(b => (
              <div key={b.id} ref={el => { cardRefs.current[b.id] = el; }}
                   className={`rounded-2xl border bg-[var(--card)] p-5 transition-shadow duration-300 scroll-mt-2 ${
                     focusedBlock === b.id ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
                   style={focusedBlock === b.id ? { boxShadow: "0 0 0 3px var(--accent-soft)" } : undefined}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  {canEdit
                    ? <input className="font-bold text-[15px] bg-transparent outline-none flex-1 min-w-0" style={{ color: COLOR_STYLES[b.color].bg }}
                             value={b.label} onChange={e => patchBlock(page.id, b.id, { label: e.target.value })} />
                    : <h4 className="font-bold text-[15px] flex-1 min-w-0" style={{ color: COLOR_STYLES[b.color].bg }}>{b.label}</h4>}
                  <CopyBtn text={[b.label, b.note, b.component && `Component: ${b.component}`, b.flag && `FLAG: ${b.flag}`].filter(Boolean).join("\n")} />
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
                  <select className="ml-auto border border-[var(--border)] rounded-full px-2 py-0.5 bg-transparent text-[11px]"
                          value={b.glyph} onChange={e => patchBlock(page.id, b.id, { glyph: e.target.value as GlyphId })}>
                    {(Object.keys(GLYPHS) as GlyphId[]).map(g => <option key={g} value={g}>{GLYPHS[g].name}</option>)}
                  </select>
                </div>}
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
              </div>
            ))}
          </div>
          <div className="w-[240px] shrink-0 border-l border-[var(--border)] overflow-y-auto p-4">
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
                      <Glyph id={b.glyph} />
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

/* ---------- intent picker ----------
   Click to toggle an intent on the block. The first selected intent is the
   primary and drives the block colour; click an already-primary intent's
   chip again to promote the next one. Order is meaningful. */
function IntentPicker({ block, personas, onChange }: {
  block: Block; personas: Persona[]; onChange: (intents: string[]) => void;
}) {
  const cur = block.intents ?? [];
  const toggle = (id: string) => {
    if (!cur.includes(id)) return onChange([...cur, id]);
    if (cur[0] === id) return onChange(cur.filter(x => x !== id));   // primary click removes
    return onChange([id, ...cur.filter(x => x !== id)]);             // promote to primary
  };
  if (personas.length === 0) {
    return <span className="text-[11px] text-[var(--muted)]">No intents defined yet</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {personas.map(p => {
        const i = cur.indexOf(p.id);
        const on = i >= 0, primary = i === 0;
        return (
          <button key={p.id} onClick={() => toggle(p.id)}
                  title={primary ? `${p.name} (primary)` : on ? `${p.name} (also serves)` : `Tag as: ${p.name}`}
                  className={`text-[10px] rounded-full pl-1.5 pr-2 py-0.5 border transition-colors flex items-center gap-1 ${
                    on ? "border-transparent" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]"}`}
                  style={on ? { background: p.color, color: readableOn(p.color) } : undefined}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "currentColor" : p.color }} />
            {p.name}{primary && personas.length > 1 ? " ★" : ""}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- mini wireframe stack ---------- */
function MiniStack({ page, personas = [] }: { page: Page; personas?: Persona[] }) {
  return (
    <div className="rounded-xl bg-[var(--card)] border-2 border-[var(--card-border)] overflow-hidden">
      <div className="text-center font-bold text-[11px] text-[var(--accent)] py-1 px-1 truncate">{page.name}</div>
      <div className="p-1 pt-0 flex flex-col gap-[3px]">
        {page.blocks.map(b => {
          const c = blockStyle(b, personas);
          return (
            <div key={b.id} className="rounded px-1 pt-0.5" style={{ background: c.bg, color: c.fg }}>
              <div className="text-[8.5px] font-semibold truncate leading-tight">{b.label}</div>
              <Glyph id={b.glyph} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- journey text export ---------- */
function journeyToText(j: Journey, intentName: string, pageName: (pid: string) => string): string {
  const lines = [`# ${j.name} (${intentName})`, ""];
  if (j.goal) lines.push(`Goal: ${j.goal}`);
  if (j.entry) lines.push(`Entry: ${j.entry}`);
  lines.push("");
  j.steps.forEach((s, i) => lines.push(`${i + 1}. ${pageName(s.pageId)}${s.note ? ` — ${s.note}` : ""}`));
  if (j.exit) lines.push("", `Exit: ${j.exit}`);
  return lines.join("\n");
}

const Arrow = ({ color }: { color: string }) => (
  <svg width="34" height="16" viewBox="0 0 34 16" className="shrink-0 self-center" aria-hidden="true">
    <line x1="2" y1="8" x2="26" y2="8" stroke={color} strokeWidth="2" strokeDasharray="5 4" />
    <path d="M25 3l6 5-6 5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- user journeys modal: intents as tabs ---------- */
function UserJourneysModal({ doc, tab, setTab, canEdit, patchPersona, addPersona, deletePersona, patchJourney, patchStep, addStep, removeStep, addJourney, deleteJourney, active, setActive, record, onClose }: {
  doc: Doc; tab: string | null; setTab: (id: string | null) => void;
  canEdit: boolean;
  patchPersona: (id: string, patch: Partial<Pick<Persona, "name" | "color" | "desc">>) => void;
  addPersona: (name: string, color: string, desc: string) => void;
  deletePersona: (id: string) => void;
  patchJourney: (jid: string, patch: Partial<Pick<Journey, "name" | "goal" | "entry" | "exit">>) => void;
  patchStep: (jid: string, idx: number, note: string) => void;
  addStep: (jid: string, pageId: string) => void;
  removeStep: (jid: string, idx: number) => void;
  addJourney: (name: string, personaId: string) => string;
  deleteJourney: (jid: string) => void;
  active: string | null; setActive: (id: string | null) => void;
  record: (jid: string) => void;
  onClose: () => void;
}) {
  const [zs, setZs] = useState<Record<string, { x: number; k: number }>>({});
  const zOf = (id: string) => zs[id] ?? { x: 0, k: 1 };
  const setZFor = (id: string) => (u: { x: number; k: number } | ((v: { x: number; k: number }) => { x: number; k: number })) =>
    setZs(sp => { const cur = sp[id] ?? { x: 0, k: 1 }; return { ...sp, [id]: typeof u === "function" ? u(cur) : u }; });
  const intent = doc.personas.find(p => p.id === tab) ?? doc.personas[0] ?? null;
  const journeys = intent ? doc.journeys.filter(j => j.personaId === intent.id) : [];
  return (
    <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="panel w-full max-w-6xl max-h-[92vh] rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
          <span className="text-[var(--accent)]"><LogoMark size={16} /></span>
          <h2 className="text-lg font-bold">User journeys</h2>
          <span className="tk text-[11px] text-[var(--muted)]">what the user actually came for</span>
          <button className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)]" onClick={onClose}>{ICONS.close}</button>
        </div>
        {/* intent tabs */}
        <div className="flex items-end flex-wrap gap-1 px-5 pt-2.5 border-b border-[var(--border)]">
          {doc.personas.map(p => (
            <button key={p.id} onClick={() => setTab(p.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-[12.5px] rounded-t-xl border border-b-0 whitespace-nowrap ${intent?.id === p.id ? "bg-[var(--card)] border-[var(--border)] font-semibold" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name}
            </button>
          ))}
          {canEdit && (
            <button className="px-3 py-2 text-[13px] text-[var(--muted)] hover:text-[var(--accent)]" title="Add intent"
                    onClick={() => { addPersona("New intent", PERSONA_COLORS[doc.personas.length % PERSONA_COLORS.length], ""); }}>{ICONS.plus}</button>
          )}
        </div>
        {!intent && <div className="p-10 text-sm text-[var(--muted)]">{canEdit ? "No intents yet. Add one with the + tab." : "No intents defined."}</div>}
        {intent && (
          <div className="flex-1 overflow-y-auto">
            {/* intent header row */}
            <div className="px-6 py-2.5 border-b border-[var(--border)] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: intent.color }} />
              {canEdit
                ? <input className="font-semibold bg-transparent outline-none text-[14px] min-w-0 flex-1" value={intent.name}
                         onChange={e => patchPersona(intent.id, { name: e.target.value })} />
                : <span className="font-semibold text-[14px] min-w-0 flex-1 truncate">{intent.name}</span>}
              {canEdit && (
                <>
                  <div className="flex gap-1">
                    {PERSONA_COLORS.map(c => (
                      <button key={c} className={`w-[14px] h-[14px] rounded-full ${intent.color === c ? "ring-2 ring-offset-1 ring-[var(--accent)] ring-offset-[var(--card)]" : ""}`}
                              style={{ background: c }} onClick={() => patchPersona(intent.id, { color: c })} />
                    ))}
                  </div>
                  <button className="text-[var(--muted)] hover:text-red-500" title="Delete intent and its journeys"
                          onClick={() => { if (confirm(`Delete intent "${intent.name}" and its journeys?`)) { deletePersona(intent.id); setTab(doc.personas.find(p => p.id !== intent.id)?.id ?? null); } }}>{ICONS.trash}</button>
                </>
              )}
            </div>
            {(canEdit || intent.desc) && (
              <div className="px-6 pb-2 border-b border-[var(--border)]">
                {canEdit
                  ? <input className="w-full bg-transparent outline-none text-[12px] text-[var(--muted)]" placeholder="Describe this intent: who arrives with it, and the evidence…"
                           value={intent.desc} onChange={e => patchPersona(intent.id, { desc: e.target.value })} />
                  : <p className="text-[12px] text-[var(--muted)]">{intent.desc}</p>}
              </div>
            )}
            {journeys.map(j => (
              <JourneyBoard key={j.id} j={j} color={intent.color} intentName={intent.name} pages={doc.pages} personas={doc.personas}
                canEdit={canEdit} z={zOf(j.id)} setZ={setZFor(j.id)}
                patchJourney={patchJourney} patchStep={patchStep} addStep={addStep} removeStep={removeStep}
                deleteJourney={deleteJourney} active={active} setActive={setActive} record={record} />
            ))}
            <div className="sticky bottom-0 px-5 py-3 border-t border-[var(--border)] bg-[var(--card)] flex items-center gap-2">
              {canEdit && (
                <button className="px-4 py-1.5 rounded-full border border-dashed border-[var(--border)] text-[12.5px] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
                        onClick={() => addJourney("New journey", intent.id)}>+ Add journey</button>
              )}
              <div className="ml-auto flex items-center gap-3">
                {journeys.map(jj => {
                  const zv = zOf(jj.id);
                  const set = setZFor(jj.id);
                  return (
                    <div key={jj.id} className="flex items-center gap-0.5 px-1.5 py-1 rounded-full border border-[var(--border)]">
                      {journeys.length > 1 && <span className="tk text-[10px] text-[var(--muted)] max-w-[110px] truncate pr-1">{jj.name}</span>}
                      <button className="px-2 rounded-full hover:bg-[var(--hover)]" aria-label="Zoom out"
                              onClick={() => set(v => ({ ...v, k: Math.max(0.4, (v.k === -1 ? 1 : v.k) * 0.9) }))}>−</button>
                      <span className="tk text-[10px] w-9 text-center tabular-nums">{zv.k === -1 ? "…" : Math.round(zv.k * 100) + "%"}</span>
                      <button className="px-2 rounded-full hover:bg-[var(--hover)]" aria-label="Zoom in"
                              onClick={() => set(v => ({ ...v, k: Math.min(1.2, (v.k === -1 ? 1 : v.k) * 1.1) }))}>+</button>
                      <button className="px-2 rounded-full hover:bg-[var(--hover)] text-[11px]" onClick={() => set({ x: 0, k: -1 })}>Fit</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JourneyBoard({ j, color, intentName, pages, personas, canEdit, patchJourney, patchStep, addStep, removeStep, deleteJourney, active, setActive, record, z, setZ }: {
  j: Journey; color: string; intentName: string; pages: Page[]; personas: Persona[]; canEdit: boolean;
  patchJourney: (jid: string, patch: Partial<Pick<Journey, "name" | "goal" | "entry" | "exit">>) => void;
  patchStep: (jid: string, idx: number, note: string) => void;
  addStep: (jid: string, pageId: string) => void;
  removeStep: (jid: string, idx: number) => void;
  deleteJourney: (jid: string) => void;
  active: string | null; setActive: (id: string | null) => void;
  record: (jid: string) => void;
  z: { x: number; k: number };
  setZ: (u: { x: number; k: number } | ((v: { x: number; k: number }) => { x: number; k: number })) => void;
}) {
  const pageOf = (pid: string) => pages.find(p => p.id === pid);
  const pageName = (pid: string) => pageOf(pid)?.name ?? "(deleted)";
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; ox: number } | null>(null);
  const clampX = (x: number, k: number) => {
    const cw = wrapRef.current?.clientWidth ?? 0;
    const w = (rowRef.current?.scrollWidth ?? 0) * k;
    return Math.min(0, Math.max(Math.min(0, cw - w), x));
  };
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("textarea,input,button,select")) return;
    dragRef.current = { sx: e.clientX, ox: z.x };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setZ(v => ({ ...v, x: clampX(d.ox + e.clientX - d.sx, v.k) }));
  };
  const onUp = () => { dragRef.current = null; };
  const fitStrip = () => {
    const cw = wrapRef.current?.clientWidth ?? 0;
    const w = rowRef.current?.scrollWidth ?? 1;
    setZ({ x: 0, k: Math.min(1, Math.max(0.4, cw / w)) });
  };
  useEffect(() => { if (z.k === -1) fitStrip(); }, [z.k]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="px-6 py-2.5 flex items-center gap-2">
        {canEdit
          ? <input className="font-semibold bg-transparent outline-none text-[13.5px] min-w-0 flex-1" value={j.name}
                   onChange={e => patchJourney(j.id, { name: e.target.value })} />
          : <span className="font-semibold text-[13.5px] min-w-0 flex-1 truncate">{j.name}</span>}
        <CopyBtn text={journeyToText(j, intentName, pageName)} />
        <button className={`text-[11px] px-2.5 py-1 rounded-full border ${active === j.id ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}
                title="Trace on canvas" onClick={() => setActive(active === j.id ? null : j.id)}>Trace</button>
        {canEdit && (
          <>
            <button className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]"
                    title="Close and record by clicking pages" onClick={() => record(j.id)}>Record</button>
            <button className="text-[var(--muted)] hover:text-red-500"
                    onClick={() => { if (confirm(`Delete journey "${j.name}"?`)) deleteJourney(j.id); }}>{ICONS.trash}</button>
          </>
        )}
      </div>
      {(canEdit || j.goal) && (
        <div className="px-6 pb-2 flex items-center gap-3">
          <span className="tk text-[10px] uppercase tracking-widest text-[var(--muted)] shrink-0">Goal</span>
          {canEdit
            ? <input className="flex-1 bg-transparent outline-none text-[13px] border-b border-transparent focus:border-[var(--border)]"
                     placeholder="What is this intent trying to achieve?"
                     value={j.goal} onChange={e => patchJourney(j.id, { goal: e.target.value })} />
            : <span className="flex-1 text-[13px]">{j.goal}</span>}
        </div>
      )}
      <div className="relative">
        <div ref={wrapRef} className="overflow-hidden select-none" style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
          <div ref={rowRef} className="flex items-start gap-1 p-5 pt-2 w-max"
               style={{ transform: `translateX(${z.x}px) scale(${z.k})`, transformOrigin: "0 0" }}>
            <div className="w-[180px] shrink-0 rounded-2xl border-2 border-dashed p-3" style={{ borderColor: color }}>
              <div className="tk text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>Entry</div>
              {canEdit
                ? <textarea className="autogrow w-full bg-transparent outline-none text-[12.5px] leading-snug min-h-[84px]"
                            placeholder="Where does this journey begin?"
                            value={j.entry} onChange={e => patchJourney(j.id, { entry: e.target.value })} />
                : <p className="text-[12.5px] leading-snug min-h-[84px] whitespace-pre-wrap">{j.entry}</p>}
            </div>
            <Arrow color={color} />
            {j.steps.map((st, i) => {
              const p = pageOf(st.pageId);
              return (
                <React.Fragment key={i}>
                  <div className="w-[200px] shrink-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0" style={{ background: color }}>{i + 1}</span>
                      <span className="text-[12px] font-semibold truncate flex-1">{pageName(st.pageId)}</span>
                      {canEdit && <button className="text-[var(--muted)] hover:text-red-500 text-[13px] px-1" title="Remove step" onClick={() => removeStep(j.id, i)}>×</button>}
                    </div>
                    {p ? <MiniStack page={p} personas={personas} /> : <div className="text-[11px] text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl p-3">page deleted</div>}
                    {canEdit
                      ? <textarea className="autogrow mt-1.5 w-full bg-transparent text-[11.5px] leading-snug text-[var(--ink)] border border-[var(--border)] rounded-lg p-1.5 min-h-[54px]"
                                  placeholder="What do they do here? Evidence?"
                                  value={st.note} onChange={e => patchStep(j.id, i, e.target.value)} />
                      : st.note && <p className="mt-1.5 w-full text-[11.5px] leading-snug text-[var(--ink)] border border-[var(--border)] rounded-lg p-1.5 whitespace-pre-wrap">{st.note}</p>}
                  </div>
                  <Arrow color={color} />
                </React.Fragment>
              );
            })}
            {canEdit && (
              <>
                <div className="w-[180px] shrink-0 rounded-2xl border-2 border-dashed border-[var(--border)] p-3 flex flex-col gap-2 items-stretch">
                  <div className="tk text-[10px] uppercase tracking-widest text-[var(--muted)]">Add step</div>
                  <select className="border border-[var(--border)] rounded-lg px-2 py-1.5 bg-transparent text-[12px] w-full"
                          value="" onChange={e => { if (e.target.value) addStep(j.id, e.target.value); }}>
                    <option value="">choose page…</option>
                    {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <p className="tk text-[9.5px] text-[var(--muted)]">or Record and click pages on the canvas</p>
                </div>
                <Arrow color={color} />
              </>
            )}
            <div className="w-[180px] shrink-0 rounded-2xl border-2 border-dashed p-3" style={{ borderColor: color }}>
              <div className="tk text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>Exit</div>
              {canEdit
                ? <textarea className="autogrow w-full bg-transparent outline-none text-[12.5px] leading-snug min-h-[84px]"
                            placeholder="Where does it end?"
                            value={j.exit} onChange={e => patchJourney(j.id, { exit: e.target.value })} />
                : <p className="text-[12.5px] leading-snug min-h-[84px] whitespace-pre-wrap">{j.exit}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- edit inspector ---------- */
function Inspector({ page, block, me, personas, close, setPageNote, patchBlock, addComment }: {
  page: Page; block: Block | null; me: string; personas: Persona[]; close: () => void;
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
            <Field label="Structural role">
              <div className="flex gap-1.5">
                {(Object.keys(COLOR_STYLES) as ColorRole[]).map(c => (
                  <button key={c} title={COLOR_STYLES[c].label}
                          className={`w-7 h-7 rounded-full ${block.color === c ? "ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--card)]" : ""}`}
                          style={{ background: COLOR_STYLES[c].bg }}
                          onClick={() => patchBlock(page.id, block.id, { color: c })} />
                ))}
              </div>
            </Field>
            {!CHROME_ROLES.includes(block.color) && (
              <Field label="Intent served (first is primary, and sets the colour)">
                <IntentPicker block={block} personas={personas}
                              onChange={intents => patchBlock(page.id, block.id, { intents })} />
              </Field>
            )}
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
