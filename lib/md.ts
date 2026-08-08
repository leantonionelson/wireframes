/* Markdown round trip.
 *
 * Export the whole document as one Markdown brief a person can hand to any AI,
 * with the editing rules written into the file itself, then merge the edited
 * copy back in.
 *
 * The format is identity-first: every page, block, intent and journey carries
 * its id in its heading (`pg:`, `bl:`, `int:`, `jr:`). That is what makes the
 * merge a merge rather than a replace - ids survive renames and moves, and a
 * heading with no id is a new item. Comments, pinned notes and the roster are
 * not in the file at all; they are preserved by id on import.
 *
 * Two rules keep a careless model from destroying work:
 *   - an absent field keeps its current value (only `(none)` clears one)
 *   - the caller must show the change list before applying, because anything
 *     missing from the file is a deletion
 */

import { GLYPHS, GLYPH_GROUPS } from "./glyphs";
import { COLOR_STYLES, PERSONA_COLORS, SCHEMA_VERSION, uid,
  type Block, type ColorRole, type Doc, type GlyphId, type Journey, type Page, type Persona } from "./model";

export const MD_VERSION = "scaffolds-md/1";

/* ================================ export ================================ */

// Field values live on one line, so a real line break travels as a literal \n
// and comes back as one. Backticks would close the value, so they become
// apostrophes; nothing else is touched.
const esc = (v: string) => v.trim().replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/`/g, "'");
const unesc = (v: string) => v.replace(/\\\\/g, "\u0000").replace(/\\n/g, "\n").replace(/\u0000/g, "\\").trim();

function fields(pairs: [string, string][]): string {
  const on = pairs.filter(([, v]) => v && v.trim());
  return on.length ? on.map(([k, v]) => `\`${k}: ${esc(v)}\``).join(" · ") : "";
}

function glyphMenu(): string {
  return GLYPH_GROUPS.map(g => {
    const ids = (Object.keys(GLYPHS) as GlyphId[]).filter(k => GLYPHS[k].group === g);
    return `- **${g}** - ` + ids.map(k => `\`${k}\` (${GLYPHS[k].name})`).join(", ");
  }).join("\n");
}

function brief(doc: Doc, mode: Mode): string {
  const roles = (Object.keys(COLOR_STYLES) as ColorRole[]).map(r => `\`${r}\``).join(" · ");
  const intents = doc.personas.length
    ? doc.personas.map(p => `\`${p.name}\``).join(" · ")
    : "none defined yet, so define them";
  const opening = mode === "create"
    ? `This is an empty scaffold: the structure of a website, page by page, and inside
each page the sequence of sections ("blocks") a visitor scrolls through. **You are
being asked to design it**, then hand the finished file back so it can be imported
into Scaffolds. Keep the format exactly as it is here; the one page below is a
placeholder to copy and replace.

### Where to start

Work out the page tree first, then fill each page with blocks. For every page write
what it is for and who arrives on it; for every block write the argument for its
existence. A page with no note and a block with no note are both worthless here: the
structure is the cheap part, the reasoning is the deliverable. Define the intents
before the pages, and tag the blocks that exist to serve one. If something depends on
a decision nobody has made yet, say so in a \`flag\` rather than inventing an answer.`
    : `This is a scaffold: the structure of a website, page by page, and inside each page
the sequence of sections ("blocks") a visitor scrolls through. It came out of
Scaffolds and it can go back in, so keep the shape of the file and change only what
you mean to change.`;
  return `## How to edit this file

${opening}

### Rules

1. **Never change, invent or reuse an id.** Ids sit at the end of a heading and look
   like \`pg:a1b2c3\` (page), \`bl:…\` (block), \`int:…\` (intent), \`jr:…\` (journey).
   They are how the import recognises what already exists.
2. **To add something**, copy the shape of a neighbour and leave the id off. A new id
   is assigned on import.
3. **To delete something**, delete its whole section. Anything missing from this file
   is removed on import, so never drop a page or block just to keep your answer short.
   If you are only asked about one page, return the entire file with that one page
   changed.
4. **To move a block to another page**, move its whole section under that page and
   keep its id.
5. **To reorder**, reorder the sections. Order in this file is order on the page, and
   the order of pages under a parent is their order in the sitemap.
6. **A field you leave out keeps its current value.** To empty a field, write
   \`(none)\` as its value. The same goes for the prose note under a block.
7. **Fields first, prose second.** Under a heading, the backticked field lines come
   first; everything after them is that item's note. A field value is one line: write
   \`\\n\` where it needs a line break, and no backticks inside a value.
8. Lines starting with \`>\` are teammate comments. They are read only, and are
   ignored on import.
9. Do not add new field names, new section levels, or a summary of your changes to
   the file. Explain your reasoning in chat instead, or in the notes where it belongs.

### What the fields mean

- \`glyph\` - which wireframe drawing the block gets. One of the ids listed below,
  chosen for what the section *is*, not for decoration.
- \`role\` - structural role. ${roles}. Header, nav, footer and external are page
  chrome and stay neutral; real content is \`content\`.
- \`intents\` - which audiences the block serves, most important first, by name.
  Available here: ${intents}. Only use intents that exist in the Intents section.
- \`component\` - the implementation target, e.g. "AEM: Promotional Banner". Leave it
  alone unless you know the platform.
- \`flag\` - a red flag: a custom build, an unresolved decision, a risk, a promise
  the site cannot keep. **Do not invent flags and do not clear one** without
  explaining it in the note.
- \`external\` - \`yes\` when the page is another system, e.g. an applicant tracker.
- The prose under the fields is the **note**: the argument for that page or block.
  Purpose, evidence, user need, content status, open questions. This is the most
  valuable part of the document. Write it as a working note between colleagues, not
  as marketing copy, and do not pad it.

### Glyph ids

${glyphMenu()}

### Import it back

Save this file, then in Scaffolds ${mode === "create"
  ? "open **New from a Markdown brief**, paste or upload it, and review what it creates."
  : "open **Export → Import edited Markdown**, paste or upload it, and review the list of changes before applying. The import is undoable."}`;
}

function blockMd(b: Block, i: number, personaName: (id: string) => string): string {
  const out: string[] = [];
  out.push(`#### ${i + 1}. ${b.label} \`bl:${b.id}\``);
  const head = fields([
    ["glyph", b.glyph],
    ["role", b.color],
    ["intents", (b.intents ?? []).map(personaName).filter(Boolean).join(", ")],
  ]);
  if (head) out.push(head);
  const comp = fields([["component", b.component]]);
  if (comp) out.push(comp);
  const flag = fields([["flag", b.flag]]);
  if (flag) out.push(flag);
  if (b.note.trim()) out.push("", b.note.trim());
  b.comments.forEach(c => out.push("", `> ${c.author}, ${new Date(c.at).toLocaleDateString()}: ${c.text.replace(/\r?\n/g, " ")}`));
  return out.join("\n");
}

function pageMd(p: Page, parent: Page | undefined, personaName: (id: string) => string): string {
  const out: string[] = [];
  out.push(`### ${p.name} \`pg:${p.id}\``);
  out.push(fields([
    ["parent", parent ? `pg:${parent.id} (${parent.name})` : "none"],
    ["external", p.external ? "yes" : ""],
  ]));
  if (p.note.trim()) out.push("", p.note.trim());
  p.blocks.forEach((b, i) => out.push("", blockMd(b, i, personaName)));
  return out.join("\n");
}

function journeyMd(j: Journey, personas: Persona[], pageById: Map<string, Page>): string {
  const per = personas.find(p => p.id === j.personaId);
  const out: string[] = [];
  out.push(`### ${j.name} \`jr:${j.id}\``);
  out.push(fields([["intent", per?.name ?? ""], ["goal", j.goal], ["entry", j.entry], ["exit", j.exit]]));
  if (j.steps.length) out.push("");
  j.steps.forEach((s, i) => {
    const p = pageById.get(s.pageId);
    out.push(`${i + 1}. ${p?.name ?? "(missing page)"} \`pg:${s.pageId}\`${s.note ? ` — ${s.note.replace(/\r?\n/g, " ")}` : ""}`);
  });
  return out.join("\n");
}

export type Mode = "edit" | "create";

/** An empty document to hang the create-from-scratch brief on. Never stored:
 *  the project is created only when the finished file comes back. */
export function starterDoc(name: string): Doc {
  return {
    id: "new", name: name.trim() || "New scaffold", schemaVersion: SCHEMA_VERSION, rev: 0, updatedAt: Date.now(), updatedBy: "brief",
    pages: [{
      id: "home", name: "Home", parentId: null, order: 0,
      note: "Replace this page. What is it for, who arrives on it, and what do they leave with?",
      blocks: [{
        id: "b1", label: "Hero", glyph: "hero", color: "content",
        note: "Replace this block. Why does this section exist, and what does it have to say?",
        component: "", flag: "", comments: [],
      }],
    }],
    personas: [], journeys: [], notes: [], members: [],
  };
}

/** The whole document as a Markdown brief, instructions included. */
export function docToMarkdown(doc: Doc, mode: Mode = "edit"): string {
  const personaName = (id: string) => doc.personas.find(p => p.id === id)?.name ?? "";
  const pageById = new Map(doc.pages.map(p => [p.id, p]));
  const out: string[] = [];

  out.push(`# ${doc.name}`, "");
  out.push(`<!-- ${MD_VERSION} project:${doc.id} rev:${doc.rev} -->`, "");
  out.push(brief(doc, mode), "");

  out.push("## Intents", "");
  if (!doc.personas.length) {
    out.push("_None yet. Add one as `### Name` on its own line, then a `` `colour: #8b5cf6` `` field, then a description in prose._", "");
  }
  doc.personas.forEach(p => {
    out.push(`### ${p.name} \`int:${p.id}\``);
    out.push(fields([["colour", p.color]]));
    if (p.desc.trim()) out.push("", p.desc.trim());
    out.push("");
  });

  out.push("## Pages", "");
  // Depth first, so a child always follows its parent and sibling order is
  // document order.
  const kids = new Map<string | null, Page[]>();
  doc.pages.forEach(p => {
    const a = kids.get(p.parentId) ?? [];
    a.push(p); kids.set(p.parentId, a);
  });
  kids.forEach(a => a.sort((x, y) => x.order - y.order));
  const walk = (parentId: string | null, parent: Page | undefined) => {
    (kids.get(parentId) ?? []).forEach(p => {
      out.push(pageMd(p, parent, personaName), "");
      walk(p.id, p);
    });
  };
  walk(null, undefined);

  out.push("## Journeys", "");
  if (!doc.journeys.length) {
    out.push("_None yet. Add one as `### Journey name`, then a field line of `` `intent:` `` `` `goal:` `` `` `entry:` `` `` `exit:` ``, then a numbered list of the pages it passes through._", "");
  }
  doc.journeys.forEach(j => out.push(journeyMd(j, doc.personas, pageById), ""));

  return out.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd() + "\n";
}

/* ================================ parse ================================= */

type Fields = Record<string, string>;
type Item = { id?: string; title: string; fields: Fields; prose: string[] };
type PBlock = Item;
type PPage = Item & { blocks: PBlock[] };
type PJourney = Item & { steps: { ref: string; note: string }[] };

const KNOWN = new Set(["glyph", "role", "intents", "component", "flag", "parent",
  "colour", "color", "intent", "goal", "entry", "exit", "external"]);
const ID_RE = /`?\b(pg|bl|int|jr):([A-Za-z0-9_-]{1,40})`?\s*$/;

function splitHeading(text: string): { title: string; id?: string; kind?: string } {
  let t = text.trim();
  let id: string | undefined, kind: string | undefined;
  const m = t.match(ID_RE);
  if (m && m.index !== undefined) { kind = m[1]; id = m[2]; t = t.slice(0, m.index).trim(); }
  t = t.replace(/^\d+[.)]\s*/, "").replace(/\*\*/g, "").replace(/[`:]\s*$/, "").trim();
  return { title: t, id, kind };
}

/** A line of `key: value` pairs. Plain (unbackticked) keys are only accepted
 *  before any prose has started, so a note that happens to open a line with
 *  "Component:" is not silently eaten. */
function parseFields(line: string, allowPlain: boolean): Fields | null {
  const t = line.trim().replace(/^[-*]\s+/, "");
  const ticked = [...t.matchAll(/`([a-zA-Z]+)\s*:\s*([^`]*)`/g)];
  if (ticked.length) {
    const leftover = t.replace(/`[a-zA-Z]+\s*:\s*[^`]*`/g, "").replace(/[·,;|\s-]/g, "");
    if (leftover === "") {
      const f: Fields = {};
      ticked.forEach(m => { const k = m[1].toLowerCase(); if (KNOWN.has(k)) f[k] = unesc(m[2]); });
      return Object.keys(f).length ? f : null;
    }
  }
  if (!allowPlain) return null;
  const m = t.match(/^[*_]{0,2}([a-zA-Z]+)[*_]{0,2}\s*:\s*(.*)$/);
  if (m && KNOWN.has(m[1].toLowerCase())) return { [m[1].toLowerCase()]: unesc(m[2]) };
  return null;
}

type Parsed = { name: string | null; intents: Item[]; pages: PPage[]; journeys: PJourney[]; ignored: string[] };

function parseMarkdown(md: string): Parsed {
  const out: Parsed = { name: null, intents: [], pages: [], journeys: [], ignored: [] };
  let section: "intents" | "pages" | "journeys" | null = null;
  let pageLevel = 3;
  let cur: Item | null = null;
  let curPage: PPage | null = null;
  let curJourney: PJourney | null = null;
  let fenced = false;

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; if (cur) cur.prose.push(line); continue; }
    if (fenced) { if (cur) cur.prose.push(line); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const { title, id, kind } = splitHeading(h[2]);

      if (level === 1) { out.name = title; cur = null; continue; }
      if (level === 2) {
        const k = title.toLowerCase();
        section = k.startsWith("intent") ? "intents"
                : k.startsWith("page") ? "pages"
                : k.startsWith("journey") ? "journeys" : null;
        cur = null; curPage = null; curJourney = null;
        pageLevel = 3;
        continue;
      }
      if (!section) { cur = null; continue; }

      // Intents and journeys are flat lists, so a deeper heading here is a
      // block that drifted out of the Pages section. Say so rather than
      // quietly turning it into an intent.
      if (section === "intents" || section === "journeys") {
        if (level > 3) { out.ignored.push(`${title} (under ${section})`); continue; }
        if (section === "intents") {
          const it: Item = { id: kind === "int" ? id : undefined, title, fields: {}, prose: [] };
          out.intents.push(it); cur = it; curJourney = null; continue;
        }
        const it: PJourney = { id: kind === "jr" ? id : undefined, title, fields: {}, prose: [], steps: [] };
        out.journeys.push(it); cur = it; curJourney = it; continue;
      }
      // pages: the first heading level in the section is the page level,
      // anything deeper is a block on the page above it.
      if (!curPage) pageLevel = level;
      if (level <= pageLevel || kind === "pg") {
        pageLevel = Math.min(pageLevel, level);
        const p: PPage = { id: kind === "pg" ? id : undefined, title, fields: {}, prose: [], blocks: [] };
        out.pages.push(p); cur = p; curPage = p; continue;
      }
      const b: PBlock = { id: kind === "bl" ? id : undefined, title, fields: {}, prose: [] };
      (curPage ?? { blocks: [] as PBlock[] }).blocks.push(b);
      cur = b; continue;
    }

    if (!cur) continue;
    if (/^\s*>/.test(line)) continue;                       // teammate comment, read only

    if (section === "journeys" && curJourney === cur) {
      const s = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (s) {
        const [, body] = s;
        const parts = body.split(/\s+[—–-]\s+/);
        curJourney.steps.push({ ref: parts[0].trim(), note: parts.slice(1).join(" - ").trim() });
        continue;
      }
    }

    const f = parseFields(line, cur.prose.length === 0);
    if (f) { Object.assign(cur.fields, f); continue; }
    if (!line.trim() && cur.prose.length === 0) continue;   // no leading blank lines
    cur.prose.push(line);
  }
  return out;
}

/* ================================ merge ================================= */

export type MdChange = {
  type: "add" | "remove" | "edit" | "move";
  scope: "project" | "intent" | "page" | "block" | "journey";
  label: string;
  detail?: string;
};
export type MdImport = {
  doc: Doc | null;
  changes: MdChange[];
  warnings: string[];
  errors: string[];
};

const CLEAR = (v: string) => v.trim().toLowerCase() === "(none)";
const prose = (lines: string[]) => lines.join("\n").trim();

function toGlyph(v: string): GlyphId | null {
  const k = v.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(GLYPHS, k)) return k as GlyphId;
  return (Object.keys(GLYPHS) as GlyphId[]).find(g => GLYPHS[g].name.toLowerCase() === k) ?? null;
}
function toRole(v: string): ColorRole | null {
  const k = v.trim().toLowerCase();
  const roles = Object.keys(COLOR_STYLES) as ColorRole[];
  if (roles.includes(k as ColorRole)) return k as ColorRole;
  return roles.find(r => COLOR_STYLES[r].label.toLowerCase() === k) ?? null;
}
/** Apply a field when present: absent keeps the current value, `(none)` clears. */
function take(f: Fields, key: string, cur: string): string | undefined {
  const v = f[key];
  if (v === undefined) return undefined;
  const next = CLEAR(v) ? "" : v.trim();
  return next === cur ? undefined : next;
}

/**
 * Merge an edited export back onto `base`. Returns the would-be document and
 * the full list of changes; nothing is applied until the caller says so.
 */
export function applyMarkdown(md: string, base: Doc): MdImport {
  const changes: MdChange[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const P = parseMarkdown(md);

  P.ignored.forEach(h => warnings.push(`Heading "${h}" is at the wrong level for that section and was ignored. Blocks belong under a page in the Pages section.`));

  if (!P.pages.length) {
    errors.push("No pages found. This does not look like a scaffold export: it needs a `## Pages` section with `### Page name \\`pg:id\\`` headings.");
    return { doc: null, changes, warnings, errors };
  }

  /* ---- intents ---- */
  const baseP = new Map(base.personas.map(p => [p.id, p]));
  const personas: Persona[] = [];
  const usedP = new Set<string>();
  P.intents.forEach((it, i) => {
    const old = it.id ? baseP.get(it.id) : undefined;
    if (it.id && !old) warnings.push(`Intent id "${it.id}" is not in this project, so "${it.title}" is added as new.`);
    const colour = (it.fields.colour ?? it.fields.color ?? "").trim();
    const p: Persona = {
      id: old?.id ?? uid(),
      name: it.title || old?.name || "Intent",
      color: /^#[0-9a-f]{3,8}$/i.test(colour) ? colour : old?.color ?? PERSONA_COLORS[i % PERSONA_COLORS.length],
      desc: it.prose.length ? (CLEAR(prose(it.prose)) ? "" : prose(it.prose)) : old?.desc ?? "",
    };
    personas.push(p);
    if (old) {
      usedP.add(old.id);
      if (old.name !== p.name) changes.push({ type: "edit", scope: "intent", label: p.name, detail: `renamed from "${old.name}"` });
      else if (old.desc !== p.desc || old.color !== p.color) changes.push({ type: "edit", scope: "intent", label: p.name });
    } else {
      changes.push({ type: "add", scope: "intent", label: p.name });
    }
  });
  base.personas.filter(p => !usedP.has(p.id)).forEach(p =>
    changes.push({ type: "remove", scope: "intent", label: p.name, detail: "its journeys go with it" }));

  const personaByName = new Map(personas.map(p => [p.name.trim().toLowerCase(), p]));
  const resolveIntent = (token: string): Persona | null => {
    const t = token.trim();
    if (!t) return null;
    const m = t.match(/^`?int:([A-Za-z0-9_-]+)`?$/);
    if (m) return personas.find(p => p.id === m[1]) ?? null;
    return personaByName.get(t.toLowerCase()) ?? null;
  };

  /* ---- pages & blocks ---- */
  const basePages = new Map(base.pages.map(p => [p.id, p]));
  const baseBlocks = new Map<string, { block: Block; page: Page }>();
  base.pages.forEach(p => p.blocks.forEach(b => baseBlocks.set(b.id, { block: b, page: p })));

  // First pass: settle ids, so `parent:` can point at a page defined later.
  const ids = P.pages.map(p => (p.id && basePages.has(p.id) ? p.id : uid()));
  P.pages.forEach((p, i) => {
    if (p.id && !basePages.has(p.id)) warnings.push(`Page id "${p.id}" is not in this project, so "${p.title}" is added as new.`);
    ids[i] = p.id && basePages.has(p.id) ? p.id : ids[i];
  });
  const byTitle = new Map<string, string>();
  P.pages.forEach((p, i) => byTitle.set(p.title.trim().toLowerCase(), ids[i]));
  const resolveParent = (raw: string | undefined, selfId: string): string | null => {
    const t = (raw ?? "").trim();
    if (!t || /^(none|root|top|-)$/i.test(t)) return null;
    const m = t.match(/`?pg:([A-Za-z0-9_-]+)`?/);
    if (m) return m[1] === selfId ? null : m[1];
    const name = t.replace(/\(.*\)/, "").trim().toLowerCase();
    const hit = byTitle.get(name);
    return hit && hit !== selfId ? hit : null;
  };

  const seenPage = new Set<string>();
  const seenBlock = new Set<string>();
  const pages: Page[] = [];
  const orderOf = new Map<string | null, number>();

  P.pages.forEach((pp, i) => {
    const id = ids[i];
    if (seenPage.has(id)) { warnings.push(`Page "${pp.title}" repeats id ${id}; the second copy is added as a new page.`); }
    const old = seenPage.has(id) ? undefined : basePages.get(id);
    const pid = old ? id : (seenPage.has(id) ? uid() : id);
    seenPage.add(pid);

    let parentId = resolveParent(pp.fields.parent, pid);
    if (parentId && !ids.includes(parentId) && !basePages.has(parentId)) {
      warnings.push(`Page "${pp.title}" names an unknown parent, so it sits at the top level.`);
      parentId = null;
    }
    const order = orderOf.get(parentId) ?? 0;
    orderOf.set(parentId, order + 1);

    const noteRaw = prose(pp.prose);
    const note = pp.prose.length ? (CLEAR(noteRaw) ? "" : noteRaw) : old?.note ?? "";
    const ext = pp.fields.external !== undefined
      ? /^(yes|true|1)$/i.test(pp.fields.external.trim())
      : old?.external ?? false;

    const blocks: Block[] = pp.blocks.map(bb => {
      const hit = bb.id ? baseBlocks.get(bb.id) : undefined;
      if (bb.id && !hit) warnings.push(`Block id "${bb.id}" is not in this project, so "${bb.title}" is added as new.`);
      const ob = hit && !seenBlock.has(hit.block.id) ? hit.block : undefined;
      const bid = ob?.id ?? uid();
      seenBlock.add(bid);

      const g = bb.fields.glyph !== undefined ? toGlyph(bb.fields.glyph) : undefined;
      if (bb.fields.glyph !== undefined && !g) warnings.push(`"${bb.title}": unknown glyph "${bb.fields.glyph}", kept ${ob?.glyph ?? "textrows"}.`);
      const r = bb.fields.role !== undefined ? toRole(bb.fields.role) : undefined;
      if (bb.fields.role !== undefined && !r) warnings.push(`"${bb.title}": unknown role "${bb.fields.role}", kept ${ob?.color ?? "content"}.`);

      let intents = ob?.intents ?? [];
      if (bb.fields.intents !== undefined) {
        const raw = bb.fields.intents;
        if (CLEAR(raw) || !raw.trim()) intents = [];
        else {
          const wanted = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
          const found = wanted.map(w => ({ w, p: resolveIntent(w) }));
          found.filter(f => !f.p).forEach(f => warnings.push(`"${bb.title}": no intent named "${f.w}", ignored.`));
          intents = found.filter(f => f.p).map(f => f.p!.id);
        }
      } else {
        intents = intents.filter(id => personas.some(p => p.id === id));
      }

      const bNoteRaw = prose(bb.prose);
      const block: Block = {
        id: bid,
        label: bb.title || ob?.label || "Block",
        glyph: g ?? ob?.glyph ?? "textrows",
        color: r ?? ob?.color ?? "content",
        note: bb.prose.length ? (CLEAR(bNoteRaw) ? "" : bNoteRaw) : ob?.note ?? "",
        component: take(bb.fields, "component", ob?.component ?? "") ?? ob?.component ?? "",
        flag: take(bb.fields, "flag", ob?.flag ?? "") ?? ob?.flag ?? "",
        comments: ob?.comments ?? [],   // never in the file, always preserved
        // untagged blocks keep no key at all, the same as the rest of the app
        ...(intents.length || (ob && "intents" in ob) ? { intents } : {}),
      };

      if (!ob) {
        changes.push({ type: "add", scope: "block", label: block.label, detail: `on ${pp.title}` });
      } else {
        if (hit && hit.page.id !== pid) changes.push({ type: "move", scope: "block", label: block.label, detail: `${hit.page.name} → ${pp.title}` });
        const diffs: string[] = [];
        if (ob.label !== block.label) diffs.push(`renamed from "${ob.label}"`);
        if (ob.note !== block.note) diffs.push("note");
        if (ob.glyph !== block.glyph) diffs.push(`glyph → ${block.glyph}`);
        if (ob.color !== block.color) diffs.push(`role → ${block.color}`);
        if (ob.component !== block.component) diffs.push("component");
        if (ob.flag !== block.flag) diffs.push(block.flag ? "flag" : "flag cleared");
        if ((ob.intents ?? []).join() !== intents.join()) diffs.push("intents");
        if (diffs.length) changes.push({ type: "edit", scope: "block", label: `${pp.title} · ${block.label}`, detail: diffs.join(", ") });
      }
      return block;
    });

    // Keep the key only when it says something: true, or already present.
    const keepExt = ext || (old ? "external" in old : false);
    const page: Page = { id: pid, name: pp.title || old?.name || "Page", parentId, order, note, blocks, ...(keepExt ? { external: ext } : {}) };
    pages.push(page);

    if (!old) {
      changes.push({ type: "add", scope: "page", label: page.name, detail: `${blocks.length} block${blocks.length === 1 ? "" : "s"}` });
    } else {
      if (old.name !== page.name) changes.push({ type: "edit", scope: "page", label: page.name, detail: `renamed from "${old.name}"` });
      if (old.parentId !== page.parentId) {
        const from = old.parentId ? basePages.get(old.parentId)?.name ?? "?" : "top level";
        const to = page.parentId ? (P.pages[ids.indexOf(page.parentId)]?.title ?? basePages.get(page.parentId)?.name ?? "?") : "top level";
        changes.push({ type: "move", scope: "page", label: page.name, detail: `${from} → ${to}` });
      }
      if (old.note !== page.note) changes.push({ type: "edit", scope: "page", label: page.name, detail: "note" });
    }
  });

  base.pages.filter(p => !seenPage.has(p.id)).forEach(p =>
    changes.push({ type: "remove", scope: "page", label: p.name, detail: `${p.blocks.length} block${p.blocks.length === 1 ? "" : "s"} with it` }));
  base.pages.forEach(p => p.blocks.forEach(b => {
    if (!seenBlock.has(b.id) && seenPage.has(p.id)) changes.push({ type: "remove", scope: "block", label: b.label, detail: `from ${p.name}` });
  }));

  /* ---- journeys ---- */
  const pageIdSet = new Set(pages.map(p => p.id));
  const pageByName = new Map(pages.map(p => [p.name.trim().toLowerCase(), p.id]));
  const baseJ = new Map(base.journeys.map(j => [j.id, j]));
  const journeys: Journey[] = [];
  const usedJ = new Set<string>();

  P.journeys.forEach(jj => {
    const old = jj.id ? baseJ.get(jj.id) : undefined;
    const per = jj.fields.intent ? resolveIntent(jj.fields.intent) : null;
    const personaId = per?.id ?? (old && personas.some(p => p.id === old.personaId) ? old.personaId : personas[0]?.id ?? "");
    if (!personaId) { warnings.push(`Journey "${jj.title}" has no intent to attach to, so it is dropped.`); return; }
    const steps = jj.steps.map(s => {
      const m = s.ref.match(/`?pg:([A-Za-z0-9_-]+)`?/);
      const byName = pageByName.get(s.ref.replace(/`?pg:[A-Za-z0-9_-]+`?/, "").trim().toLowerCase());
      const pid = (m && pageIdSet.has(m[1]) ? m[1] : undefined) ?? byName;
      if (!pid) { warnings.push(`Journey "${jj.title}": step "${s.ref}" does not match a page, so it is dropped.`); return null; }
      return { pageId: pid, note: s.note };
    }).filter(Boolean) as Journey["steps"];

    const j: Journey = {
      id: old?.id ?? uid(),
      personaId,
      name: jj.title || old?.name || "Journey",
      goal: take(jj.fields, "goal", old?.goal ?? "") ?? old?.goal ?? "",
      entry: take(jj.fields, "entry", old?.entry ?? "") ?? old?.entry ?? "",
      exit: take(jj.fields, "exit", old?.exit ?? "") ?? old?.exit ?? "",
      steps,
    };
    journeys.push(j);
    if (old) {
      usedJ.add(old.id);
      const same = old.name === j.name && old.goal === j.goal && old.entry === j.entry && old.exit === j.exit &&
        JSON.stringify(old.steps) === JSON.stringify(j.steps);
      if (!same) changes.push({ type: "edit", scope: "journey", label: j.name });
    } else {
      changes.push({ type: "add", scope: "journey", label: j.name, detail: `${steps.length} steps` });
    }
  });
  base.journeys.filter(j => !usedJ.has(j.id) && personas.some(p => p.id === j.personaId)).forEach(j =>
    changes.push({ type: "remove", scope: "journey", label: j.name }));

  /* ---- pinned notes: not in the file, re-anchored rather than dropped ---- */
  let reanchored = 0;
  const notes = base.notes.filter(n => pageIdSet.has(n.pageId)).map(n => {
    if (n.blockId && !seenBlock.has(n.blockId)) { reanchored++; return { ...n, blockId: undefined }; }
    return n;
  });
  const lostNotes = base.notes.length - notes.length;
  if (lostNotes > 0) warnings.push(`${lostNotes} pinned note${lostNotes === 1 ? "" : "s"} sit on pages this file removes, and would go with them.`);
  if (reanchored > 0) warnings.push(`${reanchored} pinned note${reanchored === 1 ? "" : "s"} lose their block and re-anchor to the page.`);

  const name = P.name?.trim() || base.name;
  if (name !== base.name) changes.push({ type: "edit", scope: "project", label: name, detail: `renamed from "${base.name}"` });

  const doc: Doc = { ...base, name, pages, personas, journeys, notes };
  return { doc, changes, warnings, errors };
}

/** A one-line "12 changes: 3 added, 1 removed…" for the review header. */
export function summarise(changes: MdChange[]): string {
  if (!changes.length) return "No changes";
  const n = (t: MdChange["type"]) => changes.filter(c => c.type === t).length;
  const parts = [
    n("add") && `${n("add")} added`,
    n("edit") && `${n("edit")} edited`,
    n("move") && `${n("move")} moved`,
    n("remove") && `${n("remove")} removed`,
  ].filter(Boolean);
  return `${changes.length} change${changes.length === 1 ? "" : "s"}: ${parts.join(", ")}`;
}
