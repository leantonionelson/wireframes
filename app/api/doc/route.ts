import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Doc } from "@/lib/model";
import { seedDoc } from "@/lib/seed";

// File-backed store. Swap this module for Postgres or a CRDT server later;
// the client only knows GET /api/doc and PUT /api/doc.
const FILE = path.join(process.cwd(), "data", "doc.json");
let lock: Promise<void> = Promise.resolve();

async function readDoc(): Promise<Doc> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    const d = seedDoc();
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(d, null, 2));
    return d;
  }
}

export async function GET(req: NextRequest) {
  const doc = await readDoc();
  const since = Number(req.nextUrl.searchParams.get("since") ?? -1);
  if (since >= 0 && doc.rev === since) {
    return NextResponse.json({ unchanged: true, rev: doc.rev });
  }
  return NextResponse.json({ doc });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as { baseRev: number; doc: Doc; by: string };
  let result: { ok: boolean; doc: Doc } | null = null;
  // serialise writes
  lock = lock.then(async () => {
    const current = await readDoc();
    if (body.baseRev !== current.rev) {
      result = { ok: false, doc: current }; // conflict: hand back server copy
      return;
    }
    const next: Doc = { ...body.doc, rev: current.rev + 1, updatedAt: Date.now(), updatedBy: body.by || "unknown" };
    await fs.writeFile(FILE, JSON.stringify(next, null, 2));
    result = { ok: true, doc: next };
  });
  await lock;
  const r = result as unknown as { ok: boolean; doc: Doc };
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
