import type { Block, Doc, JourneyStep } from "./model";

/* Versioned document migrations.
 *
 * Every shape change to Doc gets a number and a pure v(n)→v(n+1) function
 * here; boundary reads run the chain via migrateDoc. The standing rule, from
 * the implementation plan: a historical project must never become unreadable
 * because a new domain became required — so new domains land as optional
 * fields plus a migration, and old versions stay readable forever. */

export const SCHEMA_VERSION = 2;

// v0 → v1: documents that predate personas, journeys, pinned notes and
// members. Journey goal/entry/exit did not exist, and journey steps were
// bare page-id strings rather than { pageId, note } objects.
function v0to1(d: Doc): Doc {
  const journeys = (d.journeys ?? []).map(j => ({
    ...j,
    goal: j.goal ?? "", entry: j.entry ?? "", exit: j.exit ?? "",
    steps: ((j.steps ?? []) as unknown as (string | JourneyStep)[]).map(s =>
      typeof s === "string" ? { pageId: s, note: "" } : s),
  }));
  return { ...d, personas: d.personas ?? [], journeys, notes: d.notes ?? [], members: d.members ?? [] };
}

// v1 → v2: a block held one `glyph`; it now holds an ordered `glyphs` list,
// because a real section is often several wireframe elements stacked.
function v1to2(d: Doc): Doc {
  return {
    ...d,
    pages: d.pages.map(p => ({
      ...p,
      blocks: p.blocks.map(b => {
        const legacy = (b as unknown as { glyph?: string }).glyph;
        const glyphs = b.glyphs?.length ? b.glyphs : legacy ? [legacy as Block["glyphs"][number]] : ["textrows" as const];
        const { glyph: _drop, ...rest } = b as Block & { glyph?: string };
        void _drop;
        return { ...rest, glyphs };
      }),
    })),
  };
}

// Index = the version a migration lifts FROM.
const MIGRATIONS: ((d: Doc) => Doc)[] = [v0to1, v1to2];

/** Lift a document of any historical shape to the current schema. Pure and
 *  idempotent; already-current documents pass through structurally unchanged. */
export function migrateDoc(raw: Doc): Doc {
  let d = raw;
  for (let v = d.schemaVersion ?? 0; v < SCHEMA_VERSION; v++) d = MIGRATIONS[v](d);
  return d.schemaVersion === SCHEMA_VERSION ? d : { ...d, schemaVersion: SCHEMA_VERSION };
}
