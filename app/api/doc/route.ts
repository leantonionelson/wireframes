import { NextRequest, NextResponse } from "next/server";
import type { Doc } from "@/lib/model";
import { readProject, saveProject } from "@/lib/store";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (e: any) => NextResponse.json({ error: String(e?.message ?? e) }, { status: 500, headers: noStore });

export async function GET(req: NextRequest) {
  try {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const doc = await readProject(id);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
  const since = Number(req.nextUrl.searchParams.get("since") ?? -1);
  if (since >= 0 && doc.rev === since) {
    return NextResponse.json({ unchanged: true, rev: doc.rev }, { headers: noStore });
  }
  return NextResponse.json({ doc }, { headers: noStore });
  } catch (e) { return fail(e); }
}

export async function PUT(req: NextRequest) {
  try {
  const body = await req.json() as { baseRev: number; doc: Doc; by: string };
  const r = await saveProject(body.doc, body.baseRev, body.by);
  if (!r.doc) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
  return NextResponse.json(r, { status: r.ok ? 200 : 409, headers: noStore });
  } catch (e) { return fail(e); }
}
