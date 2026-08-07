"use client";
// Client side of the single-password gate: auth state hook + login modal.
// canEdit is true when auth is disabled (no password configured) or the
// edit cookie is present. The server independently enforces every mutation,
// so this is UX, not security.
import React, { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [state, setState] = useState<{ enabled: boolean; authed: boolean } | null>(null);
  const refresh = useCallback(async () => {
    try {
      const j = await fetch("/api/auth").then(r => r.json());
      setState({ enabled: !!j.enabled, authed: !!j.authed });
    } catch {
      setState({ enabled: false, authed: true });
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return {
    loaded: state !== null,
    enabled: state?.enabled ?? false,
    canEdit: state === null ? false : (!state.enabled || state.authed),
    authed: state?.authed ?? false,
    refresh,
  };
}

export async function logout() {
  await fetch("/api/auth", { method: "DELETE" });
}

export function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true); setErr(false);
    const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) { onSuccess(); onClose(); } else setErr(true);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="panel w-full max-w-sm rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-6"
           onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-[16px] mb-1">Log in to edit</h2>
        <p className="text-[12.5px] text-[var(--muted)] mb-4">Viewing is open to anyone with the link. Editing needs the team password.</p>
        <input type="password" autoFocus placeholder="Password"
               className={`w-full border rounded-full px-4 py-2 bg-transparent outline-none text-[14px] ${err ? "border-red-500" : "border-[var(--border)]"}`}
               value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
               onKeyDown={e => e.key === "Enter" && submit()} />
        {err && <p className="text-[12px] text-red-500 mt-2">That password is not right.</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-1.5 rounded-full text-[13px] hover:bg-[var(--hover)]" onClick={onClose}>Cancel</button>
          <button className="px-5 py-1.5 rounded-full bg-[var(--accent)] text-white text-[13px] disabled:opacity-50"
                  disabled={!pw || busy} onClick={submit}>{busy ? "Checking…" : "Log in"}</button>
        </div>
      </div>
    </div>
  );
}
