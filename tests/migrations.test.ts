import { describe, it, expect } from "vitest";
import { migrateDoc, SCHEMA_VERSION } from "../lib/migrations";
import type { Doc } from "../lib/model";
import { eyDoc } from "./helpers";

/* The compatibility promise: a historical project must never become
 * unreadable because the schema moved on. */

// A genuine v0 document: no schemaVersion, no personas/notes/members,
// journeys without goal/entry/exit and with bare-string steps.
const v0 = (): Doc => ({
  id: "old", name: "Old project", rev: 3, updatedAt: 1700000000000, updatedBy: "someone",
  pages: [{ id: "root", name: "Home", parentId: null, order: 0, note: "", blocks: [
    { id: "b1", label: "Hero", glyph: "hero", color: "content", note: "", component: "", flag: "", comments: [] },
  ] }],
  journeys: [{ id: "j1", personaId: "p1", name: "Old journey", steps: ["root"] }],
} as unknown as Doc);

describe("migrateDoc", () => {
  it("lifts a v0 document to the current schema", () => {
    const d = migrateDoc(v0());
    expect(d.schemaVersion).toBe(SCHEMA_VERSION);
    expect(d.personas).toEqual([]);
    expect(d.notes).toEqual([]);
    expect(d.members).toEqual([]);
    const j = d.journeys[0];
    expect(j.goal).toBe("");
    expect(j.entry).toBe("");
    expect(j.exit).toBe("");
    expect(j.steps).toEqual([{ pageId: "root", note: "" }]);
  });

  it("is idempotent", () => {
    const once = migrateDoc(v0());
    expect(migrateDoc(once)).toEqual(once);
  });

  it("passes an already-current document through structurally unchanged", () => {
    const d = eyDoc(); // helpers already run the chain
    expect(d.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrateDoc(d)).toEqual(d);
  });

  it("touches nothing it does not own", () => {
    const src = v0();
    const d = migrateDoc(src);
    expect(d.pages).toEqual(src.pages);
    expect(d.rev).toBe(3);
    expect(d.updatedBy).toBe("someone");
  });
});
