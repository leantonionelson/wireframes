"use client";
import React from "react";
import { readableOn, type Block, type Persona } from "@/lib/model";

/* ---------- intent picker ----------
   Click to toggle an intent on the block. The first selected intent is the
   primary and drives the block colour; click an already-primary intent's
   chip again to promote the next one. Order is meaningful. */
export function IntentPicker({ block, personas, onChange }: {
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
