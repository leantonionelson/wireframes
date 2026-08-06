import { promises as fs } from "fs";
import path from "path";
import type { Doc } from "./model";
import { seedDoc } from "./seed";

const DIR = path.join(process.cwd(), "data", "projects");
const safe = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

export async function listProjects(): Promise<Array<Pick<Doc, "id" | "name" | "rev" | "updatedAt" | "updatedBy">>> {
  await ensureSeed();
  const files = (await fs.readdir(DIR)).filter(f => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    try {
      const d: Doc = JSON.parse(await fs.readFile(path.join(DIR, f), "utf8"));
      out.push({ id: d.id, name: d.name, rev: d.rev, updatedAt: d.updatedAt, updatedBy: d.updatedBy });
    } catch { /* skip corrupt */ }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function readProject(id: string): Promise<Doc | null> {
  await ensureSeed();
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, safe(id) + ".json"), "utf8"));
  } catch { return null; }
}

export async function writeProject(doc: Doc): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, safe(doc.id) + ".json"), JSON.stringify(doc, null, 2));
}

export async function createProject(name: string): Promise<Doc> {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const doc: Doc = {
    id, name, rev: 1, updatedAt: Date.now(), updatedBy: "created",
    pages: [{ id: "root", name: "Home", parentId: null, order: 0, note: "", blocks: [
      { id: "b1", label: "Hero", glyph: "hero", color: "content", note: "", component: "", flag: "", comments: [] },
    ] }],
  };
  await writeProject(doc);
  return doc;
}

async function ensureSeed() {
  await fs.mkdir(DIR, { recursive: true });
  const files = await fs.readdir(DIR);
  if (files.filter(f => f.endsWith(".json")).length === 0) {
    await writeProject(seedDoc());
  }
}
