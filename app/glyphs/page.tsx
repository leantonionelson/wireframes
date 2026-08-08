"use client";
import { useState } from "react";
import { BLOCK_GLYPH_PAD, BLOCK_LABEL_PAD, GLYPHS, GLYPH_GROUPS, Wireframe } from "@/lib/glyphs";
import { PERSONA_COLORS, type GlyphId } from "@/lib/model";
import { ThemeToggle } from "@/components/Theme";

/* Design reference for the wireframe elements. Not linked from the app:
 * it exists so the drawings can be reviewed at real size, on the colours
 * they actually sit on, when changing them. */

export default function GlyphGallery() {
  const [accent, setAccent] = useState(PERSONA_COLORS[0]);
  const [width, setWidth] = useState(230);
  const cardStyle = { width, maxWidth: "100%" } as const;
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] p-4 sm:p-8 overflow-x-hidden"
          style={{ backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 mb-1 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Wireframe elements</h1>
            <span className="tk text-[12px] text-[var(--muted)]">{Object.keys(GLYPHS).length} elements · each declares its own height</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {PERSONA_COLORS.map(c => (
              <button key={c} onClick={() => setAccent(c)}
                      className={`w-5 h-5 rounded-full ${accent === c ? "ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--bg)]" : ""}`}
                      style={{ background: c }} />
            ))}
            <input type="range" min={140} max={420} value={width} onChange={e => setWidth(+e.target.value)} className="w-28 sm:w-32 sm:ml-2" />
            <span className="tk text-[11px] text-[var(--muted)] w-10">{width}px</span>
            <ThemeToggle />
          </div>
        </div>
        <p className="tk text-[12px] text-[var(--muted)] mb-8">block width {width}px · drawn in the block&apos;s intent colour</p>

        {GLYPH_GROUPS.map(grp => (
          <section key={grp} className="mb-10">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">{grp}</h2>
            <div className="flex flex-wrap gap-4 items-start">
              {(Object.keys(GLYPHS) as GlyphId[]).filter(g => GLYPHS[g].group === grp).map(g => (
                <div key={g} className="max-w-full" style={cardStyle}>
                  <div className="rounded-md overflow-hidden shadow-sm" style={{ background: accent, color: "#fff" }}>
                    <div className={`text-[10px] font-semibold leading-tight truncate ${BLOCK_LABEL_PAD}`}>{GLYPHS[g].name}</div>
                    <div className={BLOCK_GLYPH_PAD}><Wireframe ids={[g]} /></div>
                  </div>
                  <div className="tk text-[10px] text-[var(--muted)] mt-1">{g} · h{GLYPHS[g].h}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-10">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Stacked in one block</h2>
          <div className="flex flex-wrap gap-4 items-start">
            {[["hero", "cards3"], ["search", "filters"], ["banner", "herosplit", "logos"], ["article", "related"]].map((ids, i) => (
              <div key={i} className="max-w-full" style={cardStyle}>
                <div className="rounded-md overflow-hidden shadow-sm" style={{ background: accent, color: "#fff" }}>
                  <div className={`text-[10px] font-semibold leading-tight truncate ${BLOCK_LABEL_PAD}`}>{ids.join(" + ")}</div>
                  <div className={BLOCK_GLYPH_PAD}><Wireframe ids={ids as GlyphId[]} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
