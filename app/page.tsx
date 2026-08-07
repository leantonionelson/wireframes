"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark, ThemeToggle } from "@/components/Theme";
import { LoginModal, logout, useAuth } from "@/components/Auth";

type Row = { id: string; name: string; rev: number; updatedAt: number; updatedBy: string };

const gridBg = {
  backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

export default function ProjectList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const auth = useAuth();
  const load = () => fetch("/api/projects").then(r => r.json()).then(j => setRows(j.projects));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const j = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).then(r => r.json());
    window.location.href = `/p/${j.doc.id}`;
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]" style={gridBg}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)]"><LogoMark size={26} /></span>
          <h1 className="text-2xl font-bold tracking-tight">Scaffold</h1>
          <div className="ml-auto flex items-center gap-2">
            {auth.loaded && auth.enabled && !auth.authed && (
              <button className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border border-[var(--border)] text-[12px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)]"
                      onClick={() => setLoginOpen(true)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                View only · Log in
              </button>
            )}
            {auth.enabled && auth.authed && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] text-[var(--muted)]" title="Log out"
                      onClick={async () => { await logout(); auth.refresh(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <p className="tk text-[12px] text-[var(--muted)] mt-2 mb-10">collaborative sitemaps &amp; wireframes · share a project by sharing its url</p>

        {auth.canEdit && (
          <div className="flex gap-2 mb-10 p-1.5 rounded-full bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] shadow-sm">
            <input className="flex-1 rounded-full px-4 py-2 bg-transparent outline-none placeholder-[var(--muted)]" placeholder="New project name"
                   value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} />
            <button className="px-5 py-2 rounded-full bg-[var(--accent)] text-white font-medium hover:opacity-90" onClick={create}>Create</button>
          </div>
        )}

        {!rows && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {rows && rows.map(r => (
          <div key={r.id} className="relative mb-3">
            <Link href={`/p/${r.id}`}
                  className="block rounded-2xl px-5 py-4 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)]">
              <div className="font-semibold pr-10">{r.name}</div>
              <div className="tk text-[11px] text-[var(--muted)] mt-1">
                last edit {r.updatedBy} · {new Date(r.updatedAt).toLocaleString()} · rev {r.rev}
              </div>
            </Link>
            {auth.canEdit && (
              <button className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-full border border-transparent text-[var(--muted)] hover:text-red-500 hover:border-[var(--border)]"
                      title="Delete project"
                      onClick={async () => {
                        if (!confirm(`Delete "${r.name}" for everyone? This cannot be undone.`)) return;
                        await fetch(`/api/projects?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
                        load();
                      }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => auth.refresh()} />}
    </main>
  );
}
