import { NextRequest, NextResponse } from "next/server";
import { createVersion, getVersion, listVersions } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (e: any) => NextResponse.json({ error: String(e?.message ?? e) }, { status: 500, headers: noStore });

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    const vid = req.nextUrl.searchParams.get("vid");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: noStore });
    if (vid) {
      const doc = await getVersion(id, vid);
      if (!doc) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
      return NextResponse.json({ doc }, { headers: noStore });
    }
    return NextResponse.json({ versions: await listVersions(id) }, { headers: noStore });
  } catch (e) { return fail(e); }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthed(req)) return NextResponse.json({ error: "read-only: log in to save versions" }, { status: 401, headers: noStore });
    const { projectId, name, by } = await req.json() as { projectId: string; name: string; by: string };
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400, headers: noStore });
    await createVersion(projectId, name, by);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (e) { return fail(e); }
}
