import type { Doc } from "../model";
import { newProjectDoc } from "../model";
import { seedDoc } from "../seed";
import { AUTO_SNAPSHOT_MS, KEEP_VERSIONS, type ProjectMeta, type Repository, type SaveResult, type VersionMeta } from "./interfaces";

/* Postgres (Netlify DB / Neon). Atomic revision-checked writes via a
 * conditional UPDATE; version snapshots in a second table. */

export function postgresRepository(url: string): Repository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any = null;
  let ready: Promise<void> | null = null;

  async function q() {
    if (!client) {
      const { neon } = await import("@neondatabase/serverless");
      client = neon(url);
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

  async function snapshot(doc: Doc, name: string, by: string) {
    const sql = await q();
    await sql`INSERT INTO versions (project_id, name, rev, created_at, created_by, doc)
              VALUES (${doc.id}, ${name}, ${doc.rev}, ${Date.now()}, ${by}, ${JSON.stringify(doc)})`;
    await sql`DELETE FROM versions WHERE project_id = ${doc.id} AND vid NOT IN (
                SELECT vid FROM versions WHERE project_id = ${doc.id} ORDER BY created_at DESC LIMIT ${KEEP_VERSIONS})`;
  }

  const repo: Repository = {
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
        const current = await repo.read(doc.id);
        return { ok: false, doc: current };
      }
      // throttled automatic snapshot
      const last = await sql`SELECT max(created_at) AS m FROM versions WHERE project_id = ${doc.id}`;
      const lastAt = Number(last[0]?.m ?? 0);
      if (Date.now() - lastAt > AUTO_SNAPSHOT_MS) await snapshot(next, "auto", next.updatedBy);
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
      const doc = await repo.read(pid);
      if (doc) await snapshot(doc, name || "snapshot", by || "unknown");
    },
  };
  return repo;
}
