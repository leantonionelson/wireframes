import { NextRequest, NextResponse } from "next/server";
import { createProject, deleteProject, listProjects } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (e: any) => NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });

export async function GET(req: NextRequest) {
  try {
    // Interim gate until real tenancy (IMPLEMENTATION.md phase 1): with
    // SCAFFOLD_PRIVATE_LISTING set, only editors can enumerate projects.
    // Individual project URLs keep working for viewers either way.
    if (process.env.SCAFFOLD_PRIVATE_LISTING && !isAuthed(req)) {
      return NextResponse.json({ projects: [] });
    }
    return NextResponse.json({ projects: await listProjects() });
  }
  catch (e) { return fail(e); }
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "read-only: log in to create projects" }, { status: 401 });
  const { name } = await req.json() as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const doc = await createProject(name.trim());
  return NextResponse.json({ doc });
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isAuthed(req)) return NextResponse.json({ error: "read-only: log in to delete projects" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
