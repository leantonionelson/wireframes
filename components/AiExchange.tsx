"use client";
import React, { useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/Theme";
import { applyMarkdown, docToMarkdown, summarise, type MdChange, type Mode } from "@/lib/md";
import type { Doc } from "@/lib/model";
import { Button, Modal, ModalHeader, PillTabs } from "@/components/ui";

/* The Markdown round trip, deliberately without a model of our own.
 *
 * Two shapes, one machine underneath:
 *   mode "edit"   - an existing scaffold goes out and comes back merged by id
 *   mode "create" - an empty brief goes out and comes back as a new project
 *
 * Nothing is written until the author has seen what it does. */

const I = (d: React.ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONS = {
  copy: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>),
  check: I(<path d="M20 6L9 17l-5-5" />),
  down: I(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
  up: I(<><path d="M12 20V8" /><path d="M7 12l5-5 5 5" /><path d="M4 4h16" /></>),
  close: I(<path d="M18 6L6 18M6 6l12 12" />),
};

export function CopyBtn({ text, label, onCopy, className }: {
  text: string; label?: string; onCopy?: () => void; className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button title="Copy"
      className={className ?? "flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] text-[11px] shrink-0"}
      onClick={async e => { e.stopPropagation(); await navigator.clipboard.writeText(text); setDone(true); onCopy?.(); setTimeout(() => setDone(false), 1200); }}>
      {done ? ICONS.check : ICONS.copy}{label && <span>{done ? "Copied" : label}</span>}
    </button>
  );
}

const EDIT_PROMPT = `Attached is a scaffold of a website: its pages, the sections inside each page, and the reasoning behind them.

Read the "How to edit this file" section at the top of the file and follow it exactly. Keep every id, keep every page and block you were not asked to change, and stay in the same format.

What I want changed:
<describe it here, for example: add a page for early careers under Careers, and give every page a block that answers the salary question>

Reply with the complete file as a downloadable .md, not a fragment and not a list of your changes. Tell me in chat what you changed and why.`;

const CREATE_PROMPT = `Attached is an empty scaffold brief: the format Scaffolds uses to describe a website as pages, the sections inside each page, and the reasoning behind them.

Read the "How to edit this file" section at the top of the file and follow it exactly. Replace the placeholder page with the real thing and stay in that format.

What I need a sitemap for:
<describe the site here: who it is for, what it has to do, anything already decided. Paste in any research, brand notes or existing page lists you have.>

Work out the intents first, then the page tree, then the blocks inside each page. Write a real note on every page and every block: what it is for, who it serves, what evidence you are leaning on. Where something depends on a decision I have not made, put it in a flag instead of inventing an answer.

Reply with the complete file as a downloadable .md.`;

const Step = ({ n }: { n: number }) => (
  <span className="w-5 h-5 shrink-0 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
);

export function AiExchangeModal({ mode, doc, canEdit, apply, onClose, initialTab, name, setName, busy }: {
  mode: Mode;
  doc: Doc;
  canEdit: boolean;
  apply: (next: Doc) => void | Promise<void>;
  onClose: () => void;
  initialTab?: "export" | "import";
  name?: string;                       // create mode: seeds the brief's title
  setName?: (v: string) => void;
  busy?: string | null;
}) {
  const create = mode === "create";
  const [tab, setTab] = useState<"export" | "import">(canEdit ? initialTab ?? "export" : "export");
  const md = useMemo(() => docToMarkdown(doc, mode), [doc, mode]);
  const prompt = create ? CREATE_PROMPT : EDIT_PROMPT;
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<ReturnType<typeof applyMarkdown> | null>(null);
  const [fileName, setFileName] = useState("");
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const promptBox = useRef<HTMLDivElement>(null);

  const download = () => {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(create ? `${doc.name} brief` : doc.name).replace(/[^\w-]+/g, "_")}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setSent(true);
    setTimeout(() => promptBox.current?.scrollIntoView({ block: "nearest" }), 60);
  };
  const readFile = async (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    setDraft(text);
    setResult(applyMarkdown(text, doc));
  };
  const commit = async () => {
    if (!result?.doc) return;
    const gone = create ? 0 : result.changes.filter(c => c.type === "remove").length;
    if (gone && !confirm(`This removes ${gone} item${gone === 1 ? "" : "s"} from the scaffold. Apply anyway? You can undo with Cmd/Ctrl+Z.`)) return;
    await apply(result.doc);
  };

  return (
    <Modal onClose={onClose}>
      <>
        <ModalHeader onClose={onClose} subtitle="your AI, not ours"
          title={<span className="flex items-center gap-2.5"><span className="text-[var(--accent)] shrink-0"><LogoMark size={16} /></span>{create ? "Start from a brief" : "Markdown for AI"}</span>} />

        <PillTabs className="px-4 sm:px-5 py-2.5 border-b border-[var(--border)]"
          value={tab} onChange={t => setTab(t as "export" | "import")}
          items={[
            { id: "export", label: create ? "Get the brief" : "Send it out" },
            ...(canEdit ? [{ id: "import", label: create ? "Build it" : "Bring it back" }] : []),
          ]} />

        {tab === "export" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {create && setName && (
              <label className="block">
                <span className="block text-[12px] text-[var(--muted)] mb-1.5">What is this scaffold for?</span>
                <input className="w-full rounded-full border border-[var(--border)] px-4 py-2 bg-transparent outline-none text-[13px] focus:border-[var(--accent)]"
                       placeholder="e.g. Acme careers site" value={name ?? ""} onChange={e => setName(e.target.value)} />
              </label>
            )}
            <ol className="space-y-2.5 text-[13px] leading-relaxed">
              <li className="flex gap-2.5"><Step n={1} />
                <span>{create
                  ? "Download the empty brief. It carries the format and the rules with it."
                  : "Download the file, or copy it to the clipboard."}</span></li>
              <li className="flex gap-2.5"><Step n={2} />
                <span>{create
                  ? "Give it to whichever AI you use, with everything you know about the site. There is no format to explain: it is all in the file."
                  : "Give it to whichever AI you use, with what you want changed. The editing rules travel inside the file, so there is no format to explain."}</span></li>
              <li className="flex gap-2.5"><Step n={3} />
                {canEdit
                  ? <span>Paste the finished file back on the <b>{create ? "Build it" : "Bring it back"}</b> tab. {create
                      ? "You see the sitemap it produces before the project is created."
                      : "You see every change before it lands, and it undoes in one keystroke."}</span>
                  : <span>Send the finished file to someone with edit access. Importing it needs the password, and they see everything before it lands.</span>}</li>
            </ol>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={download}>{ICONS.down} Download {create ? "the brief" : ".md"}</Button>
              <CopyBtn text={md} label={create ? "Copy brief" : "Copy file"} onCopy={() => setSent(true)} />
              <span className="tk text-[11px] text-[var(--muted)] ml-auto">
                {create
                  ? `${Math.round(md.length / 1024)} KB of format and rules`
                  : `${doc.pages.length} pages · ${doc.pages.reduce((n, p) => n + p.blocks.length, 0)} blocks · ${Math.round(md.length / 1024)} KB`}
              </span>
            </div>

            {/* The file explains the format to the AI. This is the half only the
                author can write, so it appears the moment the file goes out. */}
            {sent && (
              <div ref={promptBox} className="rounded-2xl border border-[var(--accent)] p-4" style={{ background: "var(--accent-soft)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[var(--accent)]">{ICONS.check}</span>
                  <b className="text-[13px]">File is ready. Send this with it.</b>
                  <CopyBtn text={prompt} label="Copy prompt"
                           className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[11.5px] shrink-0" />
                </div>
                <p className="text-[12px] text-[var(--ink)] leading-relaxed mb-2.5 opacity-80">
                  Attach the .md file to your AI, paste this alongside it, and replace the line in angle brackets with what you actually want.
                </p>
                <pre className="tk text-[11px] leading-relaxed whitespace-pre-wrap rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 max-h-[22vh] overflow-y-auto">{prompt}</pre>
                <p className="text-[11.5px] text-[var(--ink)] leading-relaxed mt-2.5 opacity-80">
                  {canEdit
                    ? <>When the AI hands the file back, open <b>{create ? "Build it" : "Bring it back"}</b> and paste it in.</>
                    : <>When the AI hands the file back, pass it to an editor to import.</>}
                </p>
              </div>
            )}

            <details className="rounded-2xl border border-[var(--border)] overflow-hidden">
              <summary className="px-4 py-2.5 text-[12.5px] cursor-pointer select-none hover:bg-[var(--hover)]">Preview the file</summary>
              <pre className="tk text-[11px] leading-relaxed whitespace-pre-wrap p-4 pt-0 max-h-[38vh] overflow-y-auto text-[var(--muted)]">{md}</pre>
            </details>

            {!create && (
              <p className="text-[12px] text-[var(--muted)] leading-relaxed">
                Comments, pinned notes and the people list are not in the file. They stay here, matched back up by id when you import.
              </p>
            )}
          </div>
        )}

        {tab === "import" && canEdit && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => fileRef.current?.click()}>{ICONS.up} Choose a .md file</Button>
              <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="hidden"
                     onChange={e => readFile(e.target.files?.[0])} />
              <span className="text-[12px] text-[var(--muted)] truncate">{fileName || "or paste it below"}</span>
              {draft && <button className="ml-auto text-[12px] text-[var(--muted)] hover:text-[var(--ink)] shrink-0"
                                onClick={() => { setDraft(""); setResult(null); setFileName(""); }}>Clear</button>}
            </div>

            <textarea className="w-full h-[26vh] rounded-2xl border border-[var(--border)] bg-transparent p-3.5 tk text-[11.5px] leading-relaxed outline-none focus:border-[var(--accent)]"
                      placeholder={create ? "Paste the finished brief here…" : "Paste the edited Markdown here…"}
                      value={draft} onChange={e => { setDraft(e.target.value); setResult(null); }} />

            <div className="flex items-center gap-2">
              <Button variant="primary" disabled={!draft.trim()} onClick={() => setResult(applyMarkdown(draft, doc))}>
                {create ? "Read it" : "Review changes"}
              </Button>
              {result && !create && <span className="text-[12.5px] text-[var(--muted)]">{summarise(result.changes)}</span>}
            </div>

            {result && (create
              ? <CreateReview result={result} busy={busy} onApply={commit} />
              : <ImportReview result={result} onApply={commit} />)}
          </div>
        )}
      </>
    </Modal>
  );
}

/* ---------- edit mode: every change, worst first ---------- */
function ImportReview({ result, onApply }: { result: ReturnType<typeof applyMarkdown>; onApply: () => void }) {
  const { changes, warnings, errors, doc } = result;
  const tone: Record<MdChange["type"], string> = {
    add: "text-emerald-600 border-emerald-500/40",
    edit: "text-[var(--muted)] border-[var(--border)]",
    move: "text-amber-600 border-amber-500/40",
    remove: "text-red-500 border-red-500/40",
  };
  const order: MdChange["type"][] = ["remove", "move", "add", "edit"];
  const sorted = [...changes].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  return (
    <div className="space-y-3">
      <Problems errors={errors} />
      {!errors.length && !changes.length && (
        <p className="text-[12.5px] text-[var(--muted)] border border-[var(--border)] rounded-xl px-3.5 py-2.5">
          This file matches the scaffold exactly. Nothing to apply.
        </p>
      )}
      {sorted.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] max-h-[30vh] overflow-y-auto">
          {sorted.map((c, i) => (
            <div key={i} className="flex items-baseline gap-2.5 px-3.5 py-2">
              <span className={`tk text-[9.5px] uppercase tracking-wide rounded-full border px-2 py-0.5 shrink-0 ${tone[c.type]}`}>{c.type}</span>
              <span className="tk text-[10px] text-[var(--muted)] w-[52px] shrink-0">{c.scope}</span>
              <span className="text-[12.5px] min-w-0 flex-1">
                {c.label}{c.detail && <span className="text-[var(--muted)]"> · {c.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      <Warnings list={warnings} />
      {doc && changes.length > 0 && (
        <Button variant="primary" onClick={onApply}>Apply {changes.length} change{changes.length === 1 ? "" : "s"}</Button>
      )}
    </div>
  );
}

/* ---------- create mode: the sitemap it would build, as a tree ---------- */
function CreateReview({ result, busy, onApply }: {
  result: ReturnType<typeof applyMarkdown>; busy?: string | null; onApply: () => void;
}) {
  const { doc, warnings, errors } = result;
  if (!doc) return <div className="space-y-3"><Problems errors={errors} /></div>;
  const kids = (parentId: string | null) => doc.pages.filter(p => p.parentId === parentId).sort((a, b) => a.order - b.order);
  const row = (pid: string | null, depth: number): React.ReactNode[] =>
    kids(pid).flatMap(p => [
      <div key={p.id} className="flex items-baseline gap-2 px-3.5 py-1.5" style={{ paddingLeft: 14 + depth * 18 }}>
        <span className="text-[12.5px] font-semibold truncate">{p.name}</span>
        <span className="tk text-[10px] text-[var(--muted)] shrink-0">{p.blocks.length} block{p.blocks.length === 1 ? "" : "s"}</span>
        {!p.note.trim() && <span className="tk text-[10px] text-amber-600 shrink-0">no note</span>}
      </div>,
      ...row(p.id, depth + 1),
    ]);
  const blocks = doc.pages.reduce((n, p) => n + p.blocks.length, 0);
  const flags = doc.pages.reduce((n, p) => n + p.blocks.filter(b => b.flag.trim()).length, 0);
  return (
    <div className="space-y-3">
      <Problems errors={errors} />
      <p className="text-[12.5px] text-[var(--muted)]">
        <b className="text-[var(--ink)]">{doc.name}</b> · {doc.pages.length} pages · {blocks} blocks · {doc.personas.length} intents · {doc.journeys.length} journeys{flags ? ` · ${flags} flags` : ""}
      </p>
      <div className="rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] max-h-[30vh] overflow-y-auto">{row(null, 0)}</div>
      <Warnings list={warnings} />
      <Button variant="primary" disabled={!!busy} onClick={onApply}>{busy ?? "Create this scaffold"}</Button>
    </div>
  );
}

const Problems = ({ errors }: { errors: string[] }) => (
  <>{errors.map((e, i) => (
    <p key={i} className="text-[12.5px] leading-relaxed text-red-500 border border-red-500/40 rounded-xl px-3.5 py-2.5">{e}</p>
  ))}</>
);
const Warnings = ({ list }: { list: string[] }) => (
  list.length ? (
    <ul className="text-[11.5px] leading-relaxed text-amber-600 space-y-1 list-disc pl-5">
      {list.map((w, i) => <li key={i}>{w}</li>)}
    </ul>
  ) : null
);
