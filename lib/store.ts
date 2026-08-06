import { promises as fs } from "fs";
import path from "path";
import type { Doc } from "./model";
import { seedDoc } from "./seed";

// Storage adapter. With NETLIFY_DATABASE_URL (Netlify DB / Neon) or DATABASE_URL
// set, uses Postgres with atomic revision-checked writes, safe for many
// concurrent editors. Without it (local dev), falls back to JSON files.

export type ProjectMeta = Pick<Doc, "id" | "name" | "rev" | "updatedAt" | "updatedBy">;
export type SaveResult = { ok: boolean; doc: Doc | null };

// Connection resolution order: explicit env var, then Netlify's runtime
// resolver (@netlify/database, which injects the URL in deployed functions),
// then no database = file store.
let DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || "";
let resolved: Promise<string> | null = null;
function resolveDbUrl(): Promise<string> {
  if (!resolved) {
    resolved = (async () => {
      if (DB_URL) return DB_URL;
      try {
        const m = await import("@netlify/database");
        DB_URL = m.getConnectionString() || "";
      } catch { /* not on Netlify and no env var: file store */ }
      return DB_URL;
    })();
  }
  return resolved;
}

export function newProjectDoc(name: string): Doc {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  return {
    id, name, rev: 1, updatedAt: Date.now(), updatedBy: "created",
    pages: [{ id: "root", name: "Home", parentId: null, order: 0, note: "", blocks: [
      { id: "b1", label: "Hero", glyph: "hero", color: "content", note: "", component: "", flag: "", comments: [] },
    ] }],
  };
}

/* ---------------- Postgres (Netlify DB / Neon) ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;
let ready: Promise<void> | null = null;

async function q() {
  if (!client) {
    const { neon } = await import("@neondatabase/serverless");
    client = neon(DB_URL);
  }
  if (!ready) {
    ready = client`CREATE TABLE IF NOT EXISTS projects (
      id text PRIMARY KEY,
      name text NOT NULL,
      rev int NOT NULL,
      updated_at bigint NOT NULL,
      updated_by text NOT NULL,
      doc jsonb NOT NULL
    )`.then(() => undefined);
  }
  await ready;
  return client;
}

const pg = {
  async list(): Promise<ProjectMeta[]> {
    const sql = await q();
    let rows = await sql`SELECT id, name, rev, updated_at, updated_by FROM projects ORDER BY updated_at DESC`;
    if (rows.length === 0) {
      const s = seedDoc();
      await sql`INSERT INTO projects (id, name, rev, updated_at, updated_by, doc)
                VALUES (${s.id}, ${s.name}, ${s.rev}, ${s.updatedAt}, ${s.updatedBy}, ${JSON.stringify(s)})
                ON CONFLICT (id) DO NOTHING`;
      rows = await sql`SELECT id, name, rev, updated_at, updated_by FROM projects ORDER BY updated_at DESC`;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({ id: r.id, name: r.name, rev: r.rev, updatedAt: Number(r.updated_at), updatedBy: r.updated_by }));
  },
  async read(id: string): Promise<Doc | null> {
    const sql = await q();
    const rows = await sql`SELECT doc FROM projects WHERE id = ${id}`;
    return rows.length ? (rows[0].doc as Doc) : null;
  },
  async create(name: string): Promise<Doc> {
    const sql = await q();
    const d = newProjectDoc(name);
    await sql`INSERT INTO projects (id, name, rev, updated_at, updated_by, doc)
              VALUES (${d.id}, ${d.name}, ${d.rev}, ${d.updatedAt}, ${d.updatedBy}, ${JSON.stringify(d)})`;
    return d;
  },
  async save(doc: Doc, baseRev: number, by: string): Promise<SaveResult> {
    const sql = await q();
    const next: Doc = { ...doc, rev: baseRev + 1, updatedAt: Date.now(), updatedBy: by || "unknown" };
    // Atomic optimistic-concurrency update: only wins if rev is unchanged.
    const rows = await sql`UPDATE projects
      SET doc = ${JSON.stringify(next)}, name = ${next.name}, rev = ${next.rev},
          updated_at = ${next.updatedAt}, updated_by = ${next.updatedBy}
      WHERE id = ${doc.id} AND rev = ${baseRev}
      RETURNING rev`;
    if (rows.length) return { ok: true, doc: next };
    const current = await pg.read(doc.id);
    return { ok: false, doc: current };
  },
};

/* ---------------- File store (local dev fallback) ---------------- */

const DIR = path.join(process.cwd(), "data", "projects");
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");
let lock: Promise<void> = Promise.resolve();

const file = {
  async ensureSeed() {
    await fs.mkdir(DIR, { recursive: true });
    const files = await fs.readdir(DIR);
    if (files.filter(f => f.endsWith(".json")).length === 0) {
      const s = seedDoc();
      await fs.writeFile(path.join(DIR, safeId(s.id) + ".json"), JSON.stringify(s, null, 2));
    }
  },
  async list(): Promise<ProjectMeta[]> {
    await file.ensureSeed();
    const out: ProjectMeta[] = [];
    for (const f of (await fs.readdir(DIR)).filter(f => f.endsWith(".json"))) {
      try {
        const d: Doc = JSON.parse(await fs.readFile(path.join(DIR, f), "utf8"));
        out.push({ id: d.id, name: d.name, rev: d.rev, updatedAt: d.updatedAt, updatedBy: d.updatedBy });
      } catch { /* skip */ }
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async read(id: string): Promise<Doc | null> {
    await file.ensureSeed();
    try { return JSON.parse(await fs.readFile(path.join(DIR, safeId(id) + ".json"), "utf8")); }
    catch { return null; }
  },
  async create(name: string): Promise<Doc> {
    await fs.mkdir(DIR, { recursive: true });
    const d = newProjectDoc(name);
    await fs.writeFile(path.join(DIR, safeId(d.id) + ".json"), JSON.stringify(d, null, 2));
    return d;
  },
  async save(doc: Doc, baseRev: number, by: string): Promise<SaveResult> {
    let result: SaveResult = { ok: false, doc: null };
    lock = lock.then(async () => {
      const current = await file.read(doc.id);
      if (!current) { result = { ok: false, doc: null }; return; }
      if (current.rev !== baseRev) { result = { ok: false, doc: current }; return; }
      const next: Doc = { ...doc, rev: baseRev + 1, updatedAt: Date.now(), updatedBy: by || "unknown" };
      await fs.writeFile(path.join(DIR, safeId(doc.id) + ".json"), JSON.stringify(next, null, 2));
      result = { ok: true, doc: next };
    });
    await lock;
    return result;
  },
};

async function backend() {
  return (await resolveDbUrl()) ? pg : file;
}
export const listProjects: typeof pg.list = async () => (await backend()).list();
export const readProject: typeof pg.read = async (id) => (await backend()).read(id);
export const createProject: typeof pg.create = async (name) => (await backend()).create(name);
export const saveProject: typeof pg.save = async (doc, baseRev, by) => (await backend()).save(doc, baseRev, by);
