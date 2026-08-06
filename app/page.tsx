"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Row = { id: string; name: string; rev: number; updatedAt: number; updatedBy: string };

export default function ProjectList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const load = () => fetch("/api/projects").then(r => r.json()).then(j => setRows(j.projects));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const j = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).then(r => r.json());
    window.location.href = `/p/${j.doc.id}`;
  };

  return (
    <main className="min-h-screen bg-[#eef1f6] text-neutral-900">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-bold flex items-center gap-3"><span aria-hidden>🐙</span> Octo</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-8">Collaborative sitemaps and wireframes. Share a project by sharing its URL.</p>
        <div className="flex gap-2 mb-8">
          <input className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 bg-white" placeholder="New project name"
                 value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium" onClick={create}>Create</button>
        </div>
        {!rows && <p className="text-sm text-neutral-400">Loading…</p>}
        {rows && rows.map(r => (
          <div key={r.id} className="relative mb-3">
            <Link href={`/p/${r.id}`}
                  className="block bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-blue-500">
              <div className="font-semibold pr-10">{r.name}</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                last edit {r.updatedBy} · {new Date(r.updatedAt).toLocaleString()} · rev {r.rev}
              </div>
            </Link>
            <button className="absolute top-3 right-3 text-neutral-300 hover:text-red-600 text-sm"
                    title="Delete project"
                    onClick={async () => {
                      if (!confirm(`Delete "${r.name}" for everyone? This cannot be undone.`)) return;
                      await fetch(`/api/projects?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
                      load();
                    }}>🗑</button>
          </div>
        ))}
      </div>
    </main>
  );
}
