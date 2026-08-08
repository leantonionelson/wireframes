"use client";
import React, { useEffect, useRef, useState } from "react";
import { ICONS } from "./icons";

/* ---------- export menu ---------- */
export function ExportMenu({ canEdit, png = true, exportPng, openAi }: {
  canEdit: boolean;
  png?: boolean;   // PNG renders the canvas .tree node, which mobile does not mount
  exportPng: () => void;
  openAi: (tab: "export" | "import") => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const item = "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--hover)]";
  return (
    <div className="relative" ref={wrap}>
      <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] ${open ? "bg-[var(--hover)]" : "hover:bg-[var(--hover)]"}`}
              onClick={() => setOpen(o => !o)}
              title={canEdit ? "Export this scaffold, or import an edited one" : "Export this scaffold"}>
        {ICONS.export}<span className="hidden sm:inline">{canEdit ? "Export / import" : "Export"}</span>
      </button>
      {open && (
        <div className="panel absolute bottom-[46px] left-1/2 -translate-x-1/2 w-[268px] rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 z-40">
          {png && <button className={item} onClick={() => { setOpen(false); exportPng(); }}>
            <span className="text-[var(--muted)] mt-0.5">{ICONS.image}</span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold">PNG image</span>
              <span className="block text-[11px] text-[var(--muted)] leading-snug">The whole sitemap as a picture</span>
            </span>
          </button>}
          <button className={item} onClick={() => { setOpen(false); openAi("export"); }}>
            <span className="text-[var(--muted)] mt-0.5">{ICONS.md}</span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold">Markdown for AI</span>
              <span className="block text-[11px] text-[var(--muted)] leading-snug">Hand it to your own AI, edit it there, bring it back</span>
            </span>
          </button>
          {canEdit && (
            <button className={item} onClick={() => { setOpen(false); openAi("import"); }}>
              <span className="text-[var(--muted)] mt-0.5">{ICONS.upload}</span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold">Import edited Markdown</span>
                <span className="block text-[11px] text-[var(--muted)] leading-snug">Review every change before it lands</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
