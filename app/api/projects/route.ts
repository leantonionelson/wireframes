import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json() as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const doc = await createProject(name.trim());
  return NextResponse.json({ doc });
}
