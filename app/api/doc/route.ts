import { NextRequest, NextResponse } from "next/server";
import type { Doc } from "@/lib/model";
import { readProject, saveProject } from "@/lib/store";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const doc = await readProject(id);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
  const since = Number(req.nextUrl.searchParams.get("since") ?? -1);
  if (since >= 0 && doc.rev === since) {
    return NextResponse.json({ unchanged: true, rev: doc.rev }, { headers: noStore });
  }
  return NextResponse.json({ doc }, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as { baseRev: number; doc: Doc; by: string };
  const r = await saveProject(body.doc, body.baseRev, body.by);
  if (!r.doc) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
  return NextResponse.json(r, { status: r.ok ? 200 : 409, headers: noStore });
}
