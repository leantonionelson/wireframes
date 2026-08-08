import { promises as fs } from "fs";
import path from "path";
import { SCHEMA_VERSION, type Doc } from "./model";
import { seedDoc } from "./seed";

// Storage adapter. With a database URL (env var or Netlify runtime), uses
// Postgres with atomic revision-checked writes and version snapshots.
// Without one (local dev), falls back to JSON files.

export type ProjectMeta = Pick<Doc, "id" | "name" | "rev" | "updatedAt" | "updatedBy">;
export type SaveResult = { ok: boolean; doc: Doc | null };
export type VersionMeta = { vid: string; name: string; rev: number; createdAt: number; createdBy: string };

const AUTO_SNAPSHOT_MS = 10 * 60 * 1000; // one automatic version per 10 minutes of activity
const KEEP_VERSIONS = 100;

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
  // Readable slug plus enough randomness that a share URL cannot be guessed
  // or enumerated from the project name alone.
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" +
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  return {
    id, name, schemaVersion: SCHEMA_VERSION, rev: 1, updatedAt: Date.now(), updatedBy: "created",
    pages: [{ id: "root", name: "Home", parentId: null, order: 0, note: "", blocks: [
      { id: "b1", label: "Hero", glyph: "hero", color: "content", note: "", component: "", flag: "", comments: [] },
    ] }],
    personas: [], journeys: [], notes: [], members: [],
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
    ready = (async () => {
      await client`CREATE TABLE IF NOT EXISTS projects (
        id text PRIMARY KEY, name text NOT NULL, rev int NOT NULL,
        updated_at bigint NOT NULL, updated_by text NOT NULL, doc jsonb NOT NULL)`;
      await client`CREATE TABLE IF NOT EXISTS versions (
        vid serial PRIMARY KEY, project_id text NOT NULL, name text NOT NULL,
        rev int NOT NULL, created_at bigint NOT NULL, created_by text NOT NULL, doc jsonb NOT NULL)`;
    })();
  }
  await ready;
  return client;
}

async function pgSnapshot(doc: Doc, name: string, by: string) {
  const sql = await q();
  await sql`INSERT INTO versions (project_id, name, rev, created_at, created_by, doc)
            VALUES (${doc.id}, ${name}, ${doc.rev}, ${Date.now()}, ${by}, ${JSON.stringify(doc)})`;
  await sql`DELETE FROM versions WHERE project_id = ${doc.id} AND vid NOT IN (
              SELECT vid FROM versions WHERE project_id = ${doc.id} ORDER BY created_at DESC LIMIT ${KEEP_VERSIONS})`;
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
  async remove(id: string): Promise<void> {
    const sql = await q();
    await sql`DELETE FROM projects WHERE id = ${id}`;
    await sql`DELETE FROM versions WHERE project_id = ${id}`;
  },
  async save(doc: Doc, baseRev: number, by: string): Promise<SaveResult> {
    const sql = await q();
    const next: Doc = { ...doc, rev: baseRev + 1, updatedAt: Date.now(), updatedBy: by || "unknown" };
    const rows = await sql`UPDATE projects
      SET doc = ${JSON.stringify(next)}, name = ${next.name}, rev = ${next.rev},
          updated_at = ${next.updatedAt}, updated_by = ${next.updatedBy}
      WHERE id = ${doc.id} AND rev = ${baseRev}
      RETURNING rev`;
    if (!rows.length) {
      const current = await pg.read(doc.id);
      return { ok: false, doc: current };
    }
    // throttled automatic snapshot
    const last = await sql`SELECT max(created_at) AS m FROM versions WHERE project_id = ${doc.id}`;
    const lastAt = Number(last[0]?.m ?? 0);
    if (Date.now() - lastAt > AUTO_SNAPSHOT_MS) await pgSnapshot(next, "auto", next.updatedBy);
    return { ok: true, doc: next };
  },
  async listVersions(pid: string): Promise<VersionMeta[]> {
    const sql = await q();
    const rows = await sql`SELECT vid, name, rev, created_at, created_by FROM versions
                           WHERE project_id = ${pid} ORDER BY created_at DESC`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({ vid: String(r.vid), name: r.name, rev: r.rev, createdAt: Number(r.created_at), createdBy: r.created_by }));
  },
  async getVersion(pid: string, vid: string): Promise<Doc | null> {
    const sql = await q();
    const rows = await sql`SELECT doc FROM versions WHERE project_id = ${pid} AND vid = ${Number(vid)}`;
    return rows.length ? (rows[0].doc as Doc) : null;
  },
  async createVersion(pid: string, name: string, by: string): Promise<void> {
    const doc = await pg.read(pid);
    if (doc) await pgSnapshot(doc, name || "snapshot", by || "unknown");
  },
};

/* ---------------- File store (local dev fallback) ---------------- */

const DIR = path.join(process.cwd(), "data", "projects");
const VDIR = path.join(process.cwd(), "data", "versions");
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");
let lock: Promise<void> = Promise.resolve();

async function fileSnapshot(doc: Doc, name: string, by: string) {
  const dir = path.join(VDIR, safeId(doc.id));
  await fs.mkdir(dir, { recursive: true });
  const vid = String(Date.now());
  await fs.writeFile(path.join(dir, vid + ".json"),
    JSON.stringify({ vid, name, rev: doc.rev, createdAt: Date.now(), createdBy: by, doc }, null, 2));
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".json")).sort().reverse();
  for (const f of files.slice(KEEP_VERSIONS)) await fs.unlink(path.join(dir, f));
}

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
  async remove(id: string): Promise<void> {
    try { await fs.unlink(path.join(DIR, safeId(id) + ".json")); } catch { /* gone */ }
    try { await fs.rm(path.join(VDIR, safeId(id)), { recursive: true }); } catch { /* gone */ }
  },
  async save(doc: Doc, baseRev: number, by: string): Promise<SaveResult> {
    let result: SaveResult = { ok: false, doc: null };
    lock = lock.then(async () => {
      const current = await file.read(doc.id);
      if (!current) { result = { ok: false, doc: null }; return; }
      if (current.rev !== baseRev) { result = { ok: false, doc: current }; return; }
      const next: Doc = { ...doc, rev: baseRev + 1, updatedAt: Date.now(), updatedBy: by || "unknown" };
      await fs.writeFile(path.join(DIR, safeId(doc.id) + ".json"), JSON.stringify(next, null, 2));
      // throttled automatic snapshot
      try {
        const dir = path.join(VDIR, safeId(doc.id));
        const files = (await fs.readdir(dir).catch(() => [] as string[])).filter(f => f.endsWith(".json")).sort();
        const lastAt = files.length ? Number(files[files.length - 1].replace(".json", "")) : 0;
        if (Date.now() - lastAt > AUTO_SNAPSHOT_MS) await fileSnapshot(next, "auto", next.updatedBy);
      } catch { /* snapshots are best-effort */ }
      result = { ok: true, doc: next };
    });
    await lock;
    return result;
  },
  async listVersions(pid: string): Promise<VersionMeta[]> {
    const dir = path.join(VDIR, safeId(pid));
    const out: VersionMeta[] = [];
    for (const f of (await fs.readdir(dir).catch(() => [] as string[])).filter(f => f.endsWith(".json"))) {
      try {
        const v = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
        out.push({ vid: v.vid, name: v.name, rev: v.rev, createdAt: v.createdAt, createdBy: v.createdBy });
      } catch { /* skip */ }
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
  async getVersion(pid: string, vid: string): Promise<Doc | null> {
    try {
      const v = JSON.parse(await fs.readFile(path.join(VDIR, safeId(pid), safeId(vid) + ".json"), "utf8"));
      return v.doc as Doc;
    } catch { return null; }
  },
  async createVersion(pid: string, name: string, by: string): Promise<void> {
    const doc = await file.read(pid);
    if (doc) await fileSnapshot(doc, name || "snapshot", by || "unknown");
  },
};

async function backend() {
  return (await resolveDbUrl()) ? pg : file;
}
export const listProjects: typeof pg.list = async () => (await backend()).list();
export const readProject: typeof pg.read = async (id) => (await backend()).read(id);
export const createProject: typeof pg.create = async (name) => (await backend()).create(name);
export const saveProject: typeof pg.save = async (doc, baseRev, by) => (await backend()).save(doc, baseRev, by);
export const deleteProject: typeof pg.remove = async (id) => (await backend()).remove(id);
export const listVersions: typeof pg.listVersions = async (pid) => (await backend()).listVersions(pid);
export const getVersion: typeof pg.getVersion = async (pid, vid) => (await backend()).getVersion(pid, vid);
export const createVersion: typeof pg.createVersion = async (pid, name, by) => (await backend()).createVersion(pid, name, by);
