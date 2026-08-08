"use client";
import React from "react";
import { GLYPHS, GLYPH_GROUPS, Glyph } from "@/lib/glyphs";
import type { GlyphId } from "@/lib/model";

/* Choosing what a block is made of. A block is often several elements
 * stacked (a hero above three cards), so this is a list you build: the
 * chosen stack sits on top in order, the catalogue below adds to it. */

export function GlyphPicker({ glyphs, onChange }: {
  glyphs: GlyphId[];
  onChange: (next: GlyphId[]) => void;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= glyphs.length) return;
    const next = [...glyphs];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {/* the stack, in order */}
      <div className="space-y-1">
        {glyphs.map((g, i) => (
          <div key={`${g}-${i}`} className="flex items-center gap-1.5 border border-[var(--border)] rounded-xl p-1.5">
            <span className="tk text-[10px] text-[var(--muted)] w-4 text-center shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0 text-[var(--accent)]"><Glyph id={g} /></span>
            <span className="text-[10.5px] text-[var(--muted)] w-[86px] truncate shrink-0">{GLYPHS[g]?.name ?? g}</span>
            <span className="flex flex-col shrink-0">
              <button className="px-1 text-[9px] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-25"
                      disabled={i === 0} title="Move up" onClick={() => move(i, -1)}>▲</button>
              <button className="px-1 text-[9px] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-25"
                      disabled={i === glyphs.length - 1} title="Move down" onClick={() => move(i, 1)}>▼</button>
            </span>
            <button className="px-1.5 text-[13px] text-[var(--muted)] hover:text-red-500 disabled:opacity-25 shrink-0"
                    disabled={glyphs.length === 1} title="Remove element"
                    onClick={() => onChange(glyphs.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
      </div>

      {/* the catalogue: click to append */}
      <div className="border-t border-[var(--border)] pt-2 space-y-2">
        {GLYPH_GROUPS.map(grp => (
          <div key={grp}>
            <div className="tk text-[9.5px] uppercase tracking-widest text-[var(--muted)] mb-1">{grp}</div>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(GLYPHS) as GlyphId[]).filter(g => GLYPHS[g].group === grp).map(g => (
                <button key={g} title={`Add ${GLYPHS[g].name}`}
                        className={`border rounded-lg p-1 text-[var(--accent)] hover:border-[var(--accent)] ${
                          glyphs.includes(g) ? "border-[var(--accent)] bg-[var(--hover)]" : "border-[var(--border)]"}`}
                        onClick={() => onChange([...glyphs, g])}>
                  <Glyph id={g} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
