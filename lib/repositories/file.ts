import { promises as fs } from "fs";
import path from "path";
import type { Doc } from "../model";
import { newProjectDoc } from "../model";
import { seedDoc } from "../seed";
import { AUTO_SNAPSHOT_MS, KEEP_VERSIONS, type ProjectMeta, type Repository, type SaveResult, type VersionMeta } from "./interfaces";

/* JSON files under data/ — the local-dev fallback. Writes serialise through
 * a promise chain, which is this backend's version of the revision check
 * being atomic. */

export function fileRepository(root = process.cwd()): Repository {
  const DIR = path.join(root, "data", "projects");
  const VDIR = path.join(root, "data", "versions");
  const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");
  let lock: Promise<void> = Promise.resolve();

  async function snapshot(doc: Doc, name: string, by: string) {
    const dir = path.join(VDIR, safeId(doc.id));
    await fs.mkdir(dir, { recursive: true });
    const vid = String(Date.now());
    await fs.writeFile(path.join(dir, vid + ".json"),
      JSON.stringify({ vid, name, rev: doc.rev, createdAt: Date.now(), createdBy: by, doc }, null, 2));
    const files = (await fs.readdir(dir)).filter(f => f.endsWith(".json")).sort().reverse();
    for (const f of files.slice(KEEP_VERSIONS)) await fs.unlink(path.join(dir, f));
  }

  async function ensureSeed() {
    await fs.mkdir(DIR, { recursive: true });
    const files = await fs.readdir(DIR);
    if (files.filter(f => f.endsWith(".json")).length === 0) {
      const s = seedDoc();
      await fs.writeFile(path.join(DIR, safeId(s.id) + ".json"), JSON.stringify(s, null, 2));
    }
  }

  const repo: Repository = {
    async list(): Promise<ProjectMeta[]> {
      await ensureSeed();
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
      await ensureSeed();
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
        const current = await repo.read(doc.id);
        if (!current) { result = { ok: false, doc: null }; return; }
        if (current.rev !== baseRev) { result = { ok: false, doc: current }; return; }
        const next: Doc = { ...doc, rev: baseRev + 1, updatedAt: Date.now(), updatedBy: by || "unknown" };
        await fs.writeFile(path.join(DIR, safeId(doc.id) + ".json"), JSON.stringify(next, null, 2));
        // throttled automatic snapshot
        try {
          const dir = path.join(VDIR, safeId(doc.id));
          const files = (await fs.readdir(dir).catch(() => [] as string[])).filter(f => f.endsWith(".json")).sort();
          const lastAt = files.length ? Number(files[files.length - 1].replace(".json", "")) : 0;
          if (Date.now() - lastAt > AUTO_SNAPSHOT_MS) await snapshot(next, "auto", next.updatedBy);
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
      const doc = await repo.read(pid);
      if (doc) await snapshot(doc, name || "snapshot", by || "unknown");
    },
  };
  return repo;
}
