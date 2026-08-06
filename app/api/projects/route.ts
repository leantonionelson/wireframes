import { NextRequest, NextResponse } from "next/server";
import { createProject, deleteProject, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (e: any) => NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });

export async function GET() {
  try { return NextResponse.json({ projects: await listProjects() }); }
  catch (e) { return fail(e); }
}

export async function POST(req: NextRequest) {
  const { name } = await req.json() as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const doc = await createProject(name.trim());
  return NextResponse.json({ doc });
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
