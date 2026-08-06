import { NextRequest, NextResponse } from "next/server";
import type { Doc } from "@/lib/model";
import { readProject, writeProject } from "@/lib/store";

let lock: Promise<void> = Promise.resolve();

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const doc = await readProject(id);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const since = Number(req.nextUrl.searchParams.get("since") ?? -1);
  if (since >= 0 && doc.rev === since) {
    return NextResponse.json({ unchanged: true, rev: doc.rev });
  }
  return NextResponse.json({ doc });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as { baseRev: number; doc: Doc; by: string };
  let result: { ok: boolean; doc: Doc } | { error: string } | null = null;
  lock = lock.then(async () => {
    const current = await readProject(body.doc.id);
    if (!current) { result = { error: "not found" }; return; }
    if (body.baseRev !== current.rev) {
      result = { ok: false, doc: current };
      return;
    }
    const next: Doc = { ...body.doc, rev: current.rev + 1, updatedAt: Date.now(), updatedBy: body.by || "unknown" };
    await writeProject(next);
    result = { ok: true, doc: next };
  });
  await lock;
  const r = result as unknown as { ok?: boolean; doc?: Doc; error?: string };
  if (r.error) return NextResponse.json(r, { status: 404 });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
