"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { normDoc, type Doc } from "@/lib/model";

/* The document machinery: load, poll, debounced save with revision checks,
 * undo/redo history, and the annotation transport. Everything stateful about
 * the doc that is not UI lives here; the Editor composes views on top.
 *
 * Two write paths, mirrored from the API (see DEVELOPMENT.md — this split is
 * load-bearing): mutate() -> gated PUT /api/doc for structural edits;
 * sendAnnotate() -> open POST /api/annotate for notes, comments and roster,
 * merged server-side so viewers can contribute without clobbering editors. */

type Snap = Pick<Doc, "name" | "pages" | "personas" | "journeys" | "notes">;

export function useDoc(projectId: string, canEdit: boolean) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("loading");
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const docRef = useRef<Doc | null>(null);
  docRef.current = doc;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const annPending = useRef(0); // in-flight or debounced annotation ops; poll waits for them
  const history = useRef<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch(`/api/doc?id=${projectId}`).then(r => r.json());
      if (!stop) { setDoc(r.doc ? normDoc(r.doc) : null); setStatus(r.doc ? "saved" : "not found"); }
    };
    load();
    const t = setInterval(async () => {
      const d = docRef.current;
      if (!d || dirtyRef.current || annPending.current > 0) return;
      const r = await fetch(`/api/doc?id=${projectId}&since=${d.rev}`).then(r => r.json());
      if (!stop && !r.unchanged && r.doc) setDoc(normDoc(r.doc));
    }, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [projectId]);

  /* ---------- save & undo machinery ---------- */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(() => {
    setDirty(true);
    setStatus("editing");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const d = docRef.current;
      if (!d) return;
      setStatus("saving");
      const res = await fetch("/api/doc", { method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseRev: d.rev, doc: d, by: localStorage.getItem("scaffold.name") || "anon" }) });
      const j = await res.json();
      if (res.ok) { setDoc(normDoc(j.doc)); setDirty(false); setStatus("saved"); }
      else { setDoc(j.doc ? normDoc(j.doc) : docRef.current); setDirty(false); setStatus("updated by " + (j.doc?.updatedBy || "teammate")); }
    }, 700);
  }, []);

  const snapOf = (d: Doc): Snap => structuredClone({ name: d.name, pages: d.pages, personas: d.personas, journeys: d.journeys, notes: d.notes });
  const mutate = useCallback((fn: (d: Doc) => Doc) => {
    if (!canEditRef.current) return;
    setDoc(prev => {
      if (!prev) return prev;
      history.current.past.push(snapOf(prev));
      if (history.current.past.length > 60) history.current.past.shift();
      history.current.future = [];
      return fn(structuredClone(prev));
    });
    scheduleSave();
  }, [scheduleSave]);

  const undo = useCallback(() => {
    if (!canEditRef.current) return;
    const cur = docRef.current;
    const s = history.current.past.pop();
    if (!cur || !s) return;
    history.current.future.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  const redo = useCallback(() => {
    if (!canEditRef.current) return;
    const cur = docRef.current;
    const s = history.current.future.pop();
    if (!cur || !s) return;
    history.current.past.push(snapOf(cur));
    setDoc({ ...cur, ...s });
    scheduleSave();
  }, [scheduleSave]);

  /* annotation transport: pinned notes & comments are open to viewers, so
     they go through /api/annotate (server-side merge) rather than the gated
     doc PUT. Local echo first, server response adopted when we are not dirty. */
  const applyLocal = useCallback((fn: (d: Doc) => Doc) => setDoc(prev => (prev ? fn(structuredClone(prev)) : prev)), []);
  const sendAnnotate = useCallback(async (payload: Record<string, unknown>) => {
    annPending.current++;
    try {
      const r = await fetch("/api/annotate", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, ...payload }) });
      const j = await r.json();
      if (r.ok && j.doc && !dirtyRef.current) setDoc(normDoc(j.doc));
    } finally { annPending.current--; }
  }, [projectId]);

  return { doc, status, docRef, annPending, mutate, undo, redo, applyLocal, sendAnnotate };
}
