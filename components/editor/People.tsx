"use client";
import React, { useEffect, useRef, useState } from "react";
import { initialsOf, type Member } from "@/lib/model";
import { ICONS } from "./icons";

/* ---------- who am I: shared roster, per-browser selection ---------- */
export function MemberPicker({ members, meId, setMeId, addMember }: {
  members: Member[]; meId: string | null;
  setMeId: (id: string) => void;
  addMember: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const me = members.find(m => m.id === meId) ?? null;
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const submit = () => { const n = draft.trim(); if (!n) return; addMember(n); setDraft(""); setOpen(false); };
  return (
    <div className="relative" ref={wrap}>
      <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-[var(--hover)]"
              title={me ? `You are ${me.name}. Click to switch.` : "Choose who you are"}
              onClick={() => setOpen(o => !o)}>
        <span className="w-7 h-7 flex items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0"
              style={{ background: me?.color ?? "var(--muted)" }}>
          {me ? initialsOf(me.name) : "?"}
        </span>
        <span className="text-[12px] max-w-[92px] truncate hidden sm:block">{me?.name ?? "Who are you?"}</span>
      </button>
      {open && (
        <div className="panel absolute right-0 top-[42px] w-[228px] rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 z-40">
          <p className="tk text-[9.5px] uppercase tracking-widest text-[var(--muted)] px-2 pt-1 pb-1.5">Working on this</p>
          <div className="max-h-[210px] overflow-y-auto">
            {members.map(m => (
              <button key={m.id} onClick={() => { setMeId(m.id); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-[var(--hover)] ${m.id === meId ? "bg-[var(--hover)]" : ""}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full text-white text-[9px] font-bold shrink-0"
                      style={{ background: m.color }}>{initialsOf(m.name)}</span>
                <span className="text-[12.5px] truncate flex-1">{m.name}</span>
                {m.id === meId && <span className="text-[var(--accent)] shrink-0">{ICONS.check}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1 pt-1.5 border-t border-[var(--border)]">
            <input className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px] px-2 py-1 placeholder-[var(--muted)]"
                   placeholder="Add a person…" value={draft}
                   onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            <button className="px-2.5 py-1 rounded-full text-[11.5px] text-[var(--accent)] hover:bg-[var(--hover)] disabled:opacity-40 shrink-0"
                    disabled={!draft.trim()} onClick={submit}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- cursor badge: your initials trail the pointer on the canvas ---------- */
export function CursorBadge({ member }: { member: Member }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      // Guard on Element, not just null: pointer events can target non-elements.
      const t = e.target instanceof Element ? e.target : null;
      // Hide over chrome and dialogs; this is a canvas affordance.
      if (t && t.closest(".panel,.cluster,.toolbar,input,textarea,select,button")) { setP(null); return; }
      setP({ x: e.clientX, y: e.clientY });
    };
    const leave = () => setP(null);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, []);
  if (!p) return null;
  return (
    <span className="fixed z-[60] pointer-events-none select-none rounded-full px-1.5 py-[3px] text-[9.5px] font-bold text-white shadow-md"
          style={{ left: p.x + 14, top: p.y + 16, background: member.color }}>
      {initialsOf(member.name)}
    </span>
  );
}
