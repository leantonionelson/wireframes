import type { Doc } from "./model";
import type { Repository } from "./repositories/interfaces";
import { fileRepository } from "./repositories/file";
import { postgresRepository } from "./repositories/postgres";

/* Storage façade. Picks a Repository implementation at runtime: Postgres
 * (Netlify DB / Neon) when a database URL is available, JSON files under
 * data/ otherwise (local dev). API routes import these functions and stay
 * ignorant of the backend; the interfaces live in lib/repositories/. */

export type { ProjectMeta, SaveResult, VersionMeta } from "./repositories/interfaces";
export { newProjectDoc } from "./model";

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

let repo: Repository | null = null;
async function backend(): Promise<Repository> {
  if (!repo) {
    const url = await resolveDbUrl();
    repo = url ? postgresRepository(url) : fileRepository();
  }
  return repo;
}

export const listProjects = async () => (await backend()).list();
export const readProject = async (id: string) => (await backend()).read(id);
export const createProject = async (name: string) => (await backend()).create(name);
export const saveProject = async (doc: Doc, baseRev: number, by: string) => (await backend()).save(doc, baseRev, by);
export const deleteProject = async (id: string) => (await backend()).remove(id);
export const listVersions = async (pid: string) => (await backend()).listVersions(pid);
export const getVersion = async (pid: string, vid: string) => (await backend()).getVersion(pid, vid);
export const createVersion = async (pid: string, name: string, by: string) => (await backend()).createVersion(pid, name, by);
