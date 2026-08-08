"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PERSONA_COLORS, blockStyle, type Doc, type Journey, type Page, type Persona } from "@/lib/model";
import { Glyph } from "@/lib/glyphs";
import { LogoMark } from "@/components/Theme";
import { CopyBtn } from "@/components/AiExchange";
import { ICONS } from "./icons";
import { useMediaQuery } from "./useMediaQuery";
import { Button, IconButton, Modal, ModalHeader, PillTabs } from "@/components/ui";

/* ---------- journey overlay: one trace at a time ---------- */
type Seg = { d: string; color: string };
type Badge = { x: number; y: number; n: number; color: string };
export function JourneyOverlay({ journey, personas, deps }: { journey: Journey; personas: Persona[]; deps: unknown[] }) {
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

/* ---------- mini wireframe stack ---------- */
function MiniStack({ page, personas = [], max }: { page: Page; personas?: Persona[]; max?: number }) {
  // A journey step is about sequence, not the whole page: cap the preview so
  // one long page cannot dominate a stacked flow.
  const shown = max ? page.blocks.slice(0, max) : page.blocks;
  const hidden = page.blocks.length - shown.length;
  return (
    <div className="rounded-xl bg-[var(--card)] border-2 border-[var(--card-border)] overflow-hidden">
      <div className="text-center font-bold text-[11px] text-[var(--accent)] py-1 px-1 truncate">{page.name}</div>
      <div className="p-1 pt-0 flex flex-col gap-[3px]">
        {shown.map(b => {
          const c = blockStyle(b, personas);
          return (
            <div key={b.id} className="rounded px-1 pt-0.5" style={{ background: c.bg, color: c.fg }}>
              <div className="text-[8.5px] font-semibold truncate leading-tight">{b.label}</div>
              <Glyph id={b.glyph} />
            </div>
          );
        })}
        {hidden > 0 && (
          <div className="tk text-[8.5px] text-[var(--muted)] text-center py-0.5">+{hidden} more</div>
        )}
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
export function UserJourneysModal({ doc, tab, setTab, canEdit, patchPersona, addPersona, deletePersona, patchJourney, patchStep, addStep, removeStep, addJourney, deleteJourney, active, setActive, record, onClose }: {
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
    <Modal onClose={onClose} width="max-w-6xl">
      <>
        <ModalHeader title={<span className="flex items-center gap-2.5"><span className="text-[var(--accent)] shrink-0"><LogoMark size={16} /></span>User journeys</span>}
                     subtitle="what the user actually came for" onClose={onClose} />
        {/* intent tabs: pills, scrolling sideways when they outrun the width.
            The selected pill takes the intent's own colour, so the tab row
            doubles as the legend. */}
        <PillTabs className="px-4 sm:px-5 py-2.5 border-b border-[var(--border)]"
          items={doc.personas.map(p => ({ id: p.id, label: p.name, color: p.color }))}
          value={intent?.id ?? null} onChange={setTab}
          after={canEdit ? (
            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] shrink-0" title="Add intent"
                    onClick={() => { addPersona("New intent", PERSONA_COLORS[doc.personas.length % PERSONA_COLORS.length], ""); }}>{ICONS.plus}</button>
          ) : undefined} />
        {!intent && <div className="p-10 text-sm text-[var(--muted)]">{canEdit ? "No intents yet. Add one with the + tab." : "No intents defined."}</div>}
        {intent && (
          <div className="flex-1 overflow-y-auto">
            {/* intent header row */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
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
              <div className="px-4 sm:px-6 pb-2 border-b border-[var(--border)]">
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
            <div className="sticky bottom-0 px-4 sm:px-5 py-3 border-t border-[var(--border)] bg-[var(--card)] flex items-center gap-2">
              {canEdit && (
                <Button className="border-dashed text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
                        onClick={() => addJourney("New journey", intent.id)}>+ Add journey</Button>
              )}
              {/* zoom belongs to the horizontal strip; the phone stacks instead */}
              <div className="ml-auto hidden md:flex items-center gap-3">
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
      </>
    </Modal>
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

  // Natural (unscaled) height of the strip, so the wrapper can follow it.
  const [rowH, setRowH] = useState(0);
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => setRowH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [j.steps.length, canEdit]);

  // A journey is a sequence, and a phone is a column: below sm the strip
  // becomes a vertical flow with no pan or zoom, so every step is readable
  // at full width instead of clipped by a draggable row.
  const stack = useMediaQuery("(max-width: 767px)");

  const entryExit = (kind: "Entry" | "Exit", value: string, set: (v: string) => void, placeholder: string) => (
    <div className={`${stack ? "w-full" : "w-[180px] shrink-0"} rounded-2xl border-2 border-dashed p-3`} style={{ borderColor: color }}>
      <div className="tk text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>{kind}</div>
      {canEdit
        ? <textarea className={`autogrow w-full bg-transparent outline-none text-[12.5px] leading-snug ${stack ? "min-h-[52px]" : "min-h-[84px]"}`}
                    placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
        : <p className={`text-[12.5px] leading-snug whitespace-pre-wrap ${stack ? "" : "min-h-[84px]"}`}>{value}</p>}
    </div>
  );

  const stepCard = (st: { pageId: string; note: string }, i: number) => {
    const p = pageOf(st.pageId);
    return (
      <div className={stack ? "w-full flex gap-3" : "w-[200px] shrink-0"}>
        {stack && <div className="w-[86px] shrink-0">
          {p ? <MiniStack page={p} personas={personas} max={5} /> : <div className="text-[10px] text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl p-2">deleted</div>}
        </div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0" style={{ background: color }}>{i + 1}</span>
            <span className="text-[12.5px] font-semibold truncate flex-1">{pageName(st.pageId)}</span>
            {canEdit && <button className="text-[var(--muted)] hover:text-red-500 text-[15px] px-1" title="Remove step" onClick={() => removeStep(j.id, i)}>×</button>}
          </div>
          {!stack && (p
            ? <MiniStack page={p} personas={personas} />
            : <div className="text-[11px] text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl p-3">page deleted</div>)}
          {canEdit
            ? <textarea className="autogrow mt-1.5 w-full bg-transparent text-[11.5px] leading-snug text-[var(--ink)] border border-[var(--border)] rounded-lg p-1.5 min-h-[54px]"
                        placeholder="What do they do here? Evidence?"
                        value={st.note} onChange={e => patchStep(j.id, i, e.target.value)} />
            : st.note && <p className="mt-1.5 w-full text-[11.5px] leading-snug text-[var(--ink)] border border-[var(--border)] rounded-lg p-1.5 whitespace-pre-wrap">{st.note}</p>}
        </div>
      </div>
    );
  };

  const addStepCard = (
    <div className={`${stack ? "w-full" : "w-[180px] shrink-0"} rounded-2xl border-2 border-dashed border-[var(--border)] p-3 flex flex-col gap-2 items-stretch`}>
      <div className="tk text-[10px] uppercase tracking-widest text-[var(--muted)]">Add step</div>
      <select className="border border-[var(--border)] rounded-lg px-2 py-1.5 bg-transparent text-[12px] w-full"
              value="" onChange={e => { if (e.target.value) addStep(j.id, e.target.value); }}>
        <option value="">choose page…</option>
        {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {!stack && <p className="tk text-[9.5px] text-[var(--muted)]">or Record and click pages on the canvas</p>}
    </div>
  );

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
        {canEdit
          ? <input className="font-semibold bg-transparent outline-none text-[13.5px] min-w-0 flex-1" value={j.name}
                   onChange={e => patchJourney(j.id, { name: e.target.value })} />
          : <span className="font-semibold text-[13.5px] min-w-0 flex-1 truncate">{j.name}</span>}
        <CopyBtn text={journeyToText(j, intentName, pageName)} />
        <Button size="sm" variant={active === j.id ? "primary" : "secondary"} title="Trace on canvas"
                onClick={() => setActive(active === j.id ? null : j.id)}>Trace</Button>
        {canEdit && (
          <>
            <Button size="sm" title="Close and record by clicking pages" onClick={() => record(j.id)}>Record</Button>
            <IconButton label="Delete journey" danger
                        onClick={() => { if (confirm(`Delete journey "${j.name}"?`)) deleteJourney(j.id); }}>{ICONS.trash}</IconButton>
          </>
        )}
      </div>
      {(canEdit || j.goal) && (
        <div className="px-4 sm:px-6 pb-2 flex items-baseline gap-2 sm:gap-3">
          <span className="tk text-[10px] uppercase tracking-widest text-[var(--muted)] shrink-0">Goal</span>
          {canEdit
            ? (stack
                ? <textarea className="autogrow flex-1 min-w-0 bg-transparent outline-none text-[13px] leading-snug min-h-[20px] resize-none"
                            placeholder="What is this intent trying to achieve?"
                            value={j.goal} onChange={e => patchJourney(j.id, { goal: e.target.value })} />
                : <input className="flex-1 min-w-0 bg-transparent outline-none text-[13px] border-b border-transparent focus:border-[var(--border)]"
                         placeholder="What is this intent trying to achieve?"
                         value={j.goal} onChange={e => patchJourney(j.id, { goal: e.target.value })} />)
            : <span className="flex-1 min-w-0 text-[13px]">{j.goal}</span>}
        </div>
      )}

      {stack ? (
        /* vertical flow: entry, numbered steps, exit, each full width */
        <div className="px-4 pb-4 pt-1 flex flex-col items-stretch gap-1.5">
          {entryExit("Entry", j.entry, v => patchJourney(j.id, { entry: v }), "Where does this journey begin?")}
          {j.steps.map((st, i) => (
            <React.Fragment key={i}>
              <DownArrow color={color} />
              {stepCard(st, i)}
            </React.Fragment>
          ))}
          {canEdit && <><DownArrow color={color} />{addStepCard}</>}
          <DownArrow color={color} />
          {entryExit("Exit", j.exit, v => patchJourney(j.id, { exit: v }), "Where does it end?")}
        </div>
      ) : (
      <div className="relative">
        {/* The row is scaled with a transform, which does not change its
            layout box, so the wrapper has to be told how tall the scaled
            content actually is or the cards get clipped. */}
        <div ref={wrapRef} className="overflow-hidden select-none" style={{ cursor: dragRef.current ? "grabbing" : "grab", height: rowH ? rowH * z.k : undefined }}
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
          <div ref={rowRef} className="flex items-start gap-1 p-5 pt-2 w-max"
               style={{ transform: `translateX(${z.x}px) scale(${z.k})`, transformOrigin: "0 0" }}>
            {entryExit("Entry", j.entry, v => patchJourney(j.id, { entry: v }), "Where does this journey begin?")}
            <Arrow color={color} />
            {j.steps.map((st, i) => (
              <React.Fragment key={i}>
                {stepCard(st, i)}
                <Arrow color={color} />
              </React.Fragment>
            ))}
            {canEdit && <>{addStepCard}<Arrow color={color} /></>}
            {entryExit("Exit", j.exit, v => patchJourney(j.id, { exit: v }), "Where does it end?")}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

const DownArrow = ({ color }: { color: string }) => (
  <svg width="16" height="22" viewBox="0 0 16 22" className="shrink-0 self-center" aria-hidden="true">
    <line x1="8" y1="1" x2="8" y2="15" stroke={color} strokeWidth="2" strokeDasharray="5 4" />
    <path d="M3 14l5 6 5-6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
