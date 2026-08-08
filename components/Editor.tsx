"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PERSONA_COLORS, blockStyle, blankBlock, uid,
  type Block, type ColorRole, type Doc, type Journey, type Member, type Page, type Persona, type PinNote } from "@/lib/model";
import { LogoMark, ScaffoldingLoader, SCAFFOLD_CYCLE_MS, ThemeToggle } from "@/components/Theme";
import { LoginModal, logout, useAuth } from "@/components/Auth";
import { AiExchangeModal } from "@/components/AiExchange";
import { ICONS } from "./editor/icons";
import type { Sel } from "./editor/types";
import { useDoc } from "./editor/useDoc";
import { PageCard } from "./editor/PageCard";
import { FloatingToolbar } from "./editor/FloatingToolbar";
import { NotesLayer } from "./editor/NotesLayer";
import { DetailModal } from "./editor/DetailModal";
import { HistoryPanel } from "./editor/HistoryPanel";
import { ExportMenu } from "./editor/ExportMenu";
import { CursorBadge, MemberPicker } from "./editor/People";
import { JourneyOverlay, UserJourneysModal } from "./editor/Journeys";
import { Inspector } from "./editor/Inspector";
import { MobileSitemap } from "./editor/MobileSitemap";
import { useMediaQuery } from "./editor/useMediaQuery";

/* The editor orchestrator: canvas, selection, panels and modals. The doc
 * machinery lives in editor/useDoc.ts; every visual surface is its own
 * module under components/editor/. */

type Panel = "inspector" | "history" | "journeys" | null;
const COLOR_ORDER: ColorRole[] = ["header", "nav", "content", "footer", "external"];

export default function Editor({ projectId }: { projectId: string }) {
  const [sel, setSel] = useState<Sel>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [detailPageId, setDetailPageId] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const [wsTab, setWsTab] = useState<string | null>(null);
  const [me, setMe] = useState("");
  const [notesMode, setNotesMode] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTab, setAiTab] = useState<"export" | "import">("export");
  const auth = useAuth();
  const canEdit = auth.canEdit;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { doc, status, docRef, annPending, mutate, undo, redo, applyLocal, sendAnnotate } = useDoc(projectId, canEdit);

  // Hold the loader for at least one full animation cycle, so a fast load
  // does not flash a half-built mark.
  const [cycleDone, setCycleDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCycleDone(true), SCAFFOLD_CYCLE_MS);
    return () => clearTimeout(t);
  }, []);

  // Which roster member this browser is. Falls back to the old free-text name.
  const [meId, setMeId] = useState<string | null>(null);
  useEffect(() => {
    setMeId(localStorage.getItem("scaffold.memberId"));
    setMe(localStorage.getItem("scaffold.name") || localStorage.getItem("octo.name") || "anon");
  }, []);
  const chooseMe = (id: string) => {
    setMeId(id);
    localStorage.setItem("scaffold.memberId", id);
    const m = docRef.current?.members.find(m => m.id === id);
    if (m) { setMe(m.name); localStorage.setItem("scaffold.name", m.name); }
  };

  // Debounce per note id, so typing in a pinned note batches into one op.
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === "Escape") { setDetailPageId(null); setPanel(null); setSel(null); setRecording(null); setWsOpen(false); setNotesMode(false); setOpenNote(null); setAiOpen(false); }
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
    // Can throw if the pointer is already gone; panning still works without it.
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* no capture, fine */ }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
    const x = d.ox + e.clientX - d.sx, y = d.oy + e.clientY - d.sy;
    setView(v => ({ ...v, x, y }));
  };
  // Remembered past pointerup so the click that ends a pan does not drop a pin.
  const draggedRef = useRef(false);
  const onPointerUp = () => {
    draggedRef.current = !!drag.current?.moved;
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

  const meMember = doc.members.find(m => m.id === meId) ?? null;
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

  const addMember = (name: string) => {
    const m: Member = { id: uid(), name: name.trim(), color: PERSONA_COLORS[(docRef.current?.members.length ?? 0) % PERSONA_COLORS.length], at: Date.now() };
    applyLocal(d => { d.members.push(m); return d; });
    chooseMe(m.id);
    setMe(m.name); localStorage.setItem("scaffold.name", m.name);
    sendAnnotate({ op: "member-add", member: m });
  };

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
    if (draggedRef.current) return; // that click was the end of a pan
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

  // An edited Markdown brief coming back in. The change list has already been
  // reviewed in the modal; this goes through mutate so it lands in undo history
  // and saves on the normal revision-checked path.
  const applyImport = (next: Doc) => mutate(d => {
    d.name = next.name; d.pages = next.pages; d.personas = next.personas;
    d.journeys = next.journeys; d.notes = next.notes;
    return d;
  });

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
    <div className="h-screen relative bg-[var(--bg)] text-[var(--ink)] overflow-hidden"
         // In notes mode, take the click in the capture phase rather than
         // covering the canvas with an overlay. An overlay would swallow wheel
         // and drag events, so pan and zoom would die while placing notes.
         onClickCapture={e => {
           if (!notesMode) return;
           const t = e.target as HTMLElement;
           if (t.closest(".panel,.cluster,.toolbar,button,input,textarea,select")) return; // chrome still works
           e.stopPropagation();
           placePin(e);
         }}>
      {/* The phone gets a projection of the model, not a shrunken canvas:
          an expandable sitemap list, with the detail view as the page
          surface. Exactly one of the two mounts, so page/block element ids
          stay unique for the overlays. */}
      {isMobile ? (
        <MobileSitemap doc={doc} canEdit={canEdit} addChild={addChildPage}
                       open={pid => setDetailPageId(pid)} />
      ) : (
      <div className="absolute inset-0 overflow-hidden" ref={canvasRef}
           onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
           style={{ cursor: notesMode ? "crosshair" : drag.current ? "grabbing" : "grab",
                    backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
                    backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
                    backgroundPosition: `${view.x}px ${view.y}px` }}>
        <div style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})`, transformOrigin: "0 0", width: "max-content" }}>
          <div className="tree px-10 py-8"><ul>{roots.map(renderPage)}</ul></div>
        </div>
      </div>
      )}

      {!isMobile && activeJourney && <JourneyOverlay journey={activeJourney} personas={doc.personas} deps={[view, doc, active]} />}

      {/* Pinned notes are content, so they are always on screen for everyone.
          Notes mode only adds the crosshair for placing new ones. They render
          as fixed overlays outside .tree, so PNG export stays clean. On the
          phone they have no canvas geometry to anchor to, so they surface as
          counts on the sitemap rows instead. */}
      {!isMobile && doc.notes.length > 0 && (
        <NotesLayer notes={doc.notes} openId={openNote} setOpenId={setOpenNote} canEdit={canEdit} me={me}
                    patchNote={patchNote} deleteNote={deleteNote} deps={[view, doc, openNote]} />
      )}
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
        <input className="font-semibold text-[14px] bg-transparent outline-none min-w-0 w-[30vw] sm:w-[220px]" value={doc.name} readOnly={!canEdit}
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
            <span className="hidden sm:inline">View only · Log in</span>
          </button>
        )}
        <MemberPicker members={doc.members} meId={meId} setMeId={chooseMe} addMember={addMember} />
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
        {canEdit && isMobile && (
          <>
            <button className={pillBtn} onClick={undo} title="Undo">{ICONS.undo}</button>
            <button className={pillBtn} onClick={() => setPanel(panel === "history" ? null : "history")} title="Version history">{ICONS.clock}</button>
            <button className={pillBtn} onClick={redo} title="Redo">{ICONS.redo}</button>
            <span className="w-px h-5 bg-[var(--border)]" />
          </>
        )}
        {canEdit && (
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--hover)] text-[13px]" onClick={() => addChildPage(null)} title="Add top-level page">
            {ICONS.plus}<span className="hidden sm:inline">Page</span>
          </button>
        )}
        {!isMobile && <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${notesMode ? "bg-amber-400 text-amber-950" : "hover:bg-[var(--hover)]"}`}
                onClick={() => { setNotesMode(m => !m); setOpenNote(null); }}
                title="Notes: see pinned notes and add your own">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5M9 4h6l1 7 2 2H6l2-2 1-7z"/></svg>
          <span className="hidden sm:inline">Notes{doc.notes.length > 0 ? ` · ${doc.notes.length}` : ""}</span>
        </button>}
        <ExportMenu canEdit={canEdit} png={!isMobile} exportPng={exportPng}
                    openAi={tab => { setAiTab(tab); setAiOpen(true); }} />
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
      </div>

      {/* top-centre: the time controls, kept together and away from the
          make-things toolbar at the bottom */}
      {canEdit && !isMobile && (
        <div className="cluster absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
          <button className={pillBtn} onClick={undo} title="Undo (Cmd/Ctrl+Z)">{ICONS.undo}</button>
          <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-[13px] ${panel === "history" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--hover)]"}`}
                  onClick={() => setPanel(panel === "history" ? null : "history")} title="Version history">
            {ICONS.clock}<span className="hidden sm:inline">History</span>
          </button>
          <button className={pillBtn} onClick={redo} title="Redo (Cmd/Ctrl+Shift+Z)">{ICONS.redo}</button>
        </div>
      )}

      {/* bottom-right: intent legend, sits above the zoom cluster.
          Each intent opens User journeys on its own tab. */}
      {!isMobile && doc.personas.length > 0 && (
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
      {!isMobile && <div className="cluster absolute bottom-4 right-4 z-20 flex items-center px-1 py-1 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg">
        <button className="px-3 py-1 rounded-full hover:bg-[var(--hover)] text-[12px]" onClick={() => setView({ x: 60, y: 84, k: 0.8 })}>Fit</button>
        <button className="px-2.5 py-1 rounded-full hover:bg-[var(--hover)]" onClick={() => setView(v => ({ ...v, k: Math.max(0.25, v.k * 0.9) }))}>−</button>
        <span className="tk w-11 text-center text-[11px] tabular-nums">{Math.round(view.k * 100)}%</span>
        <button className="px-2.5 py-1 rounded-full hover:bg-[var(--hover)]" onClick={() => setView(v => ({ ...v, k: Math.min(2, v.k * 1.1) }))}>+</button>
      </div>}

      {/* floating per-element toolbar */}
      {!isMobile && selPage && !detailPage && !recording && (
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
              {/* Adding blocks and pages lives on the card itself, and the page
                  note is editable in the detail view. */}
              <button className={pillBtn} title="Page detail & copy" onClick={() => setDetailPageId(selPage.id)}>{ICONS.detail}</button>
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


      {detailPage && <DetailModal page={detailPage} personas={doc.personas} me={me} canEdit={canEdit} addComment={addComment} setPageNote={setPageNote} patchBlock={patchBlock}
        addBlk={() => mutate(d => { d.pages.find(p => p.id === detailPage.id)!.blocks.push(blankBlock()); return d; })}
        delBlock={bid => deleteBlock(detailPage.id, bid)}
        delPage={() => deletePage(detailPage.id)}
        onClose={() => setDetailPageId(null)} />}
      {wsOpen && <UserJourneysModal doc={doc} tab={wsTab} setTab={setWsTab} canEdit={canEdit}
        patchPersona={patchPersona} addPersona={addPersona} deletePersona={deletePersona}
        patchJourney={patchJourney} patchStep={patchStep} addStep={appendStep} removeStep={removeStep}
        addJourney={addJourney} deleteJourney={deleteJourney}
        active={active} setActive={setActive}
        record={(jid) => { setRecording(jid); setWsOpen(false); }}
        onClose={() => setWsOpen(false)} />}
      {aiOpen && <AiExchangeModal mode="edit" doc={doc} canEdit={canEdit} initialTab={aiTab}
                                  apply={next => { applyImport(next); setAiOpen(false); }}
                                  onClose={() => setAiOpen(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => auth.refresh()} />}
      {!isMobile && meMember && <CursorBadge member={meMember} />}
    </div>
  );
}
