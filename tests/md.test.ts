import { describe, it, expect } from "vitest";
import { applyMarkdown, docToMarkdown, starterDoc, MD_VERSION } from "../lib/md";
import { eyDoc, comparable, lineIndex } from "./helpers";

/* The Markdown round trip is the product's API to every external AI.
 * These tests are the format's contract; if one fails after an intentional
 * format change, update the golden file deliberately, never casually. */

describe("export", () => {
  const doc = eyDoc();
  const md = docToMarkdown(doc);

  it("matches the golden file exactly", async () => {
    await expect(md).toMatchFileSnapshot("./golden/ey-global-careers.md");
  });

  it("declares the protocol version and project identity", () => {
    expect(md).toContain(`<!-- ${MD_VERSION} project:${doc.id} rev:${doc.rev} -->`);
  });

  it("carries an id for every page, block, intent and journey", () => {
    for (const p of doc.pages) expect(md).toContain(`\`pg:${p.id}\``);
    for (const p of doc.pages) for (const b of p.blocks) expect(md).toContain(`\`bl:${b.id}\``);
    for (const i of doc.personas) expect(md).toContain(`\`int:${i.id}\``);
    for (const j of doc.journeys) expect(md).toContain(`\`jr:${j.id}\``);
  });

  it("escapes multi-line field values onto one line", () => {
    // Two EY flags contain real newlines; in the file they must be literal \n.
    const flagLines = md.split("\n").filter(l => l.startsWith("`flag:"));
    expect(flagLines.length).toBeGreaterThan(0);
    for (const l of flagLines) expect(l).not.toContain("\r");
    expect(md).toContain("\\n");
  });

  it("keeps comments out of editable content but visible as quotes", () => {
    expect(md).toContain("> stephanie,");
    expect(md).not.toContain("fixc1"); // comment ids never leak into the file
  });
});

describe("identity round trip", () => {
  it("re-importing an untouched export changes nothing", () => {
    const doc = eyDoc();
    const r = applyMarkdown(docToMarkdown(doc), doc);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.changes).toEqual([]);
    expect(r.doc).not.toBeNull();
    expect(comparable(r.doc!)).toEqual(comparable(doc));
  });

  it("preserves comments, pinned notes and members byte-for-byte", () => {
    const doc = eyDoc();
    const r = applyMarkdown(docToMarkdown(doc), doc);
    const flat = (d: typeof doc) => d.pages.flatMap(p => p.blocks.flatMap(b => b.comments));
    expect(flat(r.doc!)).toEqual(flat(doc));
    expect(r.doc!.notes).toEqual(doc.notes);
    expect(r.doc!.members).toEqual(doc.members);
  });
});

describe("edits", () => {
  it("reports a rename, a glyph change and an added block as exactly those changes", () => {
    const doc = eyDoc();
    const lines = docToMarkdown(doc).split("\n");

    const p1 = lineIndex(lines, /^### .*`pg:/);
    lines[p1] = lines[p1].replace(/^### [^`]+/, "### Home renamed ");
    const g = lineIndex(lines, /^`glyph: /);
    lines[g] = lines[g].replace(/glyph: [a-z0-9]+/, "glyph: cards4");
    const p2 = lineIndex(lines, /^### .*`pg:/, p1 + 1);
    lines.splice(p2 - 1, 0, "#### 99. Brand new block", "`glyph: stats` · `role: content`", "", "A note written by the AI.", "");

    const r = applyMarkdown(lines.join("\n"), doc);
    expect(r.errors).toEqual([]);
    const kinds = r.changes.map(c => `${c.type}:${c.scope}`).sort();
    expect(kinds).toEqual(["add:block", "edit:block", "edit:page"]);
    expect(r.changes.find(c => c.scope === "page")!.detail).toMatch(/renamed from/);

    const home = r.doc!.pages.find(p => p.name === "Home renamed")!;
    expect(home.blocks.at(-1)!.label).toBe("Brand new block");
    expect(home.blocks.at(-1)!.note).toBe("A note written by the AI.");
    expect(home.blocks[0].glyphs).toEqual(["cards4"]);
  });

  it("an absent field keeps its value; (none) clears it", () => {
    const doc = eyDoc();
    const lines = docToMarkdown(doc).split("\n");
    const f = lineIndex(lines, /^`flag: /);
    const before = applyMarkdown(lines.join("\n"), doc);
    expect(before.changes).toEqual([]);

    const kept = [...lines];
    kept.splice(f, 1);                       // drop the flag line entirely
    expect(applyMarkdown(kept.join("\n"), doc).changes).toEqual([]);

    const cleared = [...lines];
    cleared[f] = "`flag: (none)`";
    const r = applyMarkdown(cleared.join("\n"), doc);
    expect(r.changes).toHaveLength(1);
    expect(r.changes[0].detail).toBe("flag cleared");
  });
});

describe("structural surgery", () => {
  it("page delete, cross-page block move and child add all report correctly", () => {
    const doc = eyDoc();
    const lines = docToMarkdown(doc).split("\n");
    const p2 = lineIndex(lines, /^### .*`pg:/, lineIndex(lines, /^### .*`pg:/) + 1);
    const p3 = lineIndex(lines, /^### .*`pg:/, p2 + 1);
    const deletedName = lines[p2].match(/^### ([^`]+)/)![1].trim();

    // remove the second page whole, but graft its first block onto page one
    const removed = lines.splice(p2, p3 - p2);
    const blockStart = lineIndex(removed, /^#### /);
    const blockEnd = lineIndex(removed, /^#### /, blockStart + 1);
    const moved = removed.slice(blockStart, blockEnd === -1 ? undefined : blockEnd);
    const graft = lineIndex(lines, /^### .*`pg:/, lineIndex(lines, /^### .*`pg:/) + 1);
    lines.splice(graft - 1, 0, ...moved, "");

    const r = applyMarkdown(lines.join("\n"), doc);
    expect(r.errors).toEqual([]);
    expect(r.changes.filter(c => c.type === "remove" && c.scope === "page").map(c => c.label)).toEqual([deletedName]);
    expect(r.changes.some(c => c.type === "move" && c.scope === "block")).toBe(true);
    expect(r.doc!.pages).toHaveLength(doc.pages.length - 1);
  });

  it("a journey step pointing at a deleted page is dropped with a warning, not silently", () => {
    const doc = eyDoc();
    const stepPage = doc.pages.find(p => doc.journeys.some(j => j.steps.some(s => s.pageId === p.id)))!;
    const lines = docToMarkdown(doc).split("\n");
    const start = lineIndex(lines, new RegExp("^### .*`pg:" + stepPage.id + "`"));
    let end = lineIndex(lines, /^### /, start + 1);
    if (end === -1) end = lineIndex(lines, /^## /, start + 1);
    lines.splice(start, end - start);

    const r = applyMarkdown(lines.join("\n"), doc);
    expect(r.warnings.some(w => w.includes("does not match a page"))).toBe(true);
    for (const j of r.doc!.journeys) for (const s of j.steps) {
      expect(r.doc!.pages.some(p => p.id === s.pageId)).toBe(true);
    }
  });
});

describe("truncation and malformed input", () => {
  it("half a file is reported as removals, never accepted quietly", () => {
    const doc = eyDoc();
    const lines = docToMarkdown(doc).split("\n");
    const r = applyMarkdown(lines.slice(0, Math.floor(lines.length / 2)).join("\n"), doc);
    expect(r.changes.filter(c => c.type === "remove").length).toBeGreaterThan(0);
  });

  it("a file with no pages section is an error, not an empty import", () => {
    const doc = eyDoc();
    const r = applyMarkdown("# Something\n\nJust prose, no structure.\n", doc);
    expect(r.doc).toBeNull();
    expect(r.errors).toHaveLength(1);
    expect(r.changes).toEqual([]);
  });

  it("a block heading stranded in the journeys section is ignored with a warning", () => {
    const doc = eyDoc();
    const r = applyMarkdown(docToMarkdown(doc) + "\n#### Stray block\n`glyph: hero`\n", doc);
    expect(r.changes).toEqual([]);
    expect(r.warnings.some(w => w.includes("wrong level"))).toBe(true);
  });

  it("unknown glyphs and roles keep the old value and warn", () => {
    const doc = eyDoc();
    const lines = docToMarkdown(doc).split("\n");
    const g = lineIndex(lines, /^`glyph: /);
    const oldGlyph = lines[g].match(/glyph: ([a-z0-9]+)/)![1];
    lines[g] = lines[g].replace(/glyph: [a-z0-9]+/, "glyph: hologram").replace(/role: [a-z]+/, "role: sparkle");
    const r = applyMarkdown(lines.join("\n"), doc);
    expect(r.warnings.some(w => w.includes('unknown glyph "hologram"'))).toBe(true);
    expect(r.warnings.some(w => w.includes('unknown role "sparkle"'))).toBe(true);
    const first = r.doc!.pages.find(p => p.id === doc.pages[0].id)!;
    expect(first.blocks[0].glyphs).toEqual([oldGlyph]);
  });

  it("an unknown id is treated as a new item and warned about, not adopted", () => {
    const doc = eyDoc();
    const md = docToMarkdown(doc) + "\n### Invented page `pg:doesnotexist`\n`parent: none`\n\nA page with a fabricated id.\n";
    // appended after journeys: must NOT become a page (wrong section)…
    const r = applyMarkdown(md, doc);
    expect(r.doc!.pages.some(p => p.id === "doesnotexist")).toBe(false);
    // …and inside the pages section it becomes a fresh id with a warning.
    const lines = docToMarkdown(doc).split("\n");
    const j = lineIndex(lines, /^## Journeys/);
    lines.splice(j, 0, "### Invented page `pg:doesnotexist`", "`parent: none`", "", "A page with a fabricated id.", "");
    const r2 = applyMarkdown(lines.join("\n"), doc);
    expect(r2.warnings.some(w => w.includes('"doesnotexist"'))).toBe(true);
    const added = r2.changes.filter(c => c.type === "add" && c.scope === "page");
    expect(added).toHaveLength(1);
  });

  it("field values round-trip backslash and newline escapes", () => {
    const doc = eyDoc();
    doc.pages[0].blocks[0].flag = "line one\nline two \\n literal";
    const r = applyMarkdown(docToMarkdown(doc), doc);
    expect(r.changes).toEqual([]);
    expect(r.doc!.pages.find(p => p.id === doc.pages[0].id)!.blocks[0].flag)
      .toBe("line one\nline two \\n literal");
  });
});

describe("create mode", () => {
  it("starterDoc export carries the create framing and a placeholder to replace", () => {
    const md = docToMarkdown(starterDoc("Acme careers"), "create");
    expect(md).toContain("You are\nbeing asked to design it");
    expect(md).toContain("Replace this page.");
  });

  it("a finished brief builds the full sitemap with intents, nesting and journeys", () => {
    const base = starterDoc("Acme careers");
    const brief = [
      "# Acme careers site", "",
      "## Intents", "",
      "### Graduate", "`colour: #f59e0b`", "", "First role.", "",
      "## Pages", "",
      "### Home", "`parent: none`", "", "Routes everyone.", "",
      "#### 1. Hero", "`glyph: hero` · `role: content`", "",
      "### Programme", "`parent: Home`", "",
      "#### 1. Steps", "`glyph: steps` · `role: content` · `intents: Graduate`", "",
      "### Jobs", "`parent: none` · `external: yes`", "",
      "#### 1. Search", "`glyph: filters` · `role: external`", "",
      "## Journeys", "",
      "### First visit", "`intent: Graduate` · `goal: understand the offer`", "",
      "1. Home — arrives", "2. Programme — reads the stages", "",
    ].join("\n");
    const r = applyMarkdown(brief, base);
    expect(r.errors).toEqual([]);
    expect(r.doc!.name).toBe("Acme careers site");
    expect(r.doc!.pages.map(p => p.name)).toEqual(["Home", "Programme", "Jobs"]);
    const prog = r.doc!.pages[1];
    expect(prog.parentId).toBe(r.doc!.pages[0].id);
    expect(r.doc!.pages[2].external).toBe(true);
    expect(prog.blocks[0].intents).toEqual([r.doc!.personas[0].id]);
    expect(r.doc!.journeys[0].steps.map(s => s.pageId))
      .toEqual([r.doc!.pages[0].id, prog.id]);
  });
});

describe("import limits", () => {
  it("refuses oversized input before parsing", () => {
    const doc = eyDoc();
    const r = applyMarkdown("#".repeat(2 * 1024 * 1024 + 1), doc);
    expect(r.doc).toBeNull();
    expect(r.errors[0]).toMatch(/too large/);
  });
});
