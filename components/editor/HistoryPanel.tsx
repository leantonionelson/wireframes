"use client";
import React, { useCallback, useEffect, useState } from "react";
import type { Doc } from "@/lib/model";
import { ICONS } from "./icons";

/* ---------- version history panel ---------- */
type VMeta = { vid: string; name: string; rev: number; createdAt: number; createdBy: string };
export function HistoryPanel({ projectId, me, close, restore }: {
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
