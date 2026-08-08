"use client";
import React, { useState } from "react";
import { CHROME_ROLES, COLOR_STYLES, type Block, type ColorRole, type GlyphId, type Page, type Persona } from "@/lib/model";
import { GLYPHS } from "@/lib/glyphs";
import { ICONS } from "./icons";
import { IntentPicker } from "./IntentPicker";

/* ---------- edit inspector ---------- */
export function Inspector({ page, block, me, personas, close, setPageNote, patchBlock, addComment }: {
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
