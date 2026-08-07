import { NextRequest, NextResponse } from "next/server";
import { normDoc, type Comment, type PinNote } from "@/lib/model";
import { readProject, saveProject } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

// The annotation layer (pinned notes + block comments) is open to viewers:
// feedback from people without the edit password is the point. Everything
// else about the doc stays behind the gated PUT. Ops are merged server-side
// against the latest revision with a small retry loop, so annotating never
// clobbers concurrent edits.
export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };

type Op =
  | { op: "note-add"; note: PinNote }
  | { op: "note-patch"; id: string; text: string; author: string }
  | { op: "note-delete"; id: string; author: string }
  | { op: "comment-add"; pageId: string; blockId: string; comment: Comment };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { projectId: string } & Op;
    if (!body.projectId) return NextResponse.json({ error: "projectId required" }, { status: 400, headers: noStore });
    const authed = isAuthed(req);

    for (let attempt = 0; attempt < 3; attempt++) {
      const raw = await readProject(body.projectId);
      if (!raw) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
      const doc = normDoc(raw);
      let by = "annotation";

      if (body.op === "note-add") {
        doc.notes.push(body.note);
        by = body.note.author || "anon";
      } else if (body.op === "note-patch" || body.op === "note-delete") {
        const n = doc.notes.find(n => n.id === body.id);
        if (!n) return NextResponse.json({ error: "note not found" }, { status: 404, headers: noStore });
        // Editors can touch any note; viewers only their own.
        if (!authed && n.author !== body.author) {
          return NextResponse.json({ error: "not your note" }, { status: 403, headers: noStore });
        }
        if (body.op === "note-patch") n.text = body.text;
        else doc.notes = doc.notes.filter(x => x.id !== body.id);
        by = body.author || "anon";
      } else if (body.op === "comment-add") {
        const block = doc.pages.find(p => p.id === body.pageId)?.blocks.find(b => b.id === body.blockId);
        if (!block) return NextResponse.json({ error: "block not found" }, { status: 404, headers: noStore });
        block.comments.push(body.comment);
        by = body.comment.author || "anon";
      } else {
        return NextResponse.json({ error: "unknown op" }, { status: 400, headers: noStore });
      }

      const r = await saveProject(doc, doc.rev, by);
      if (r.ok && r.doc) return NextResponse.json({ doc: r.doc }, { headers: noStore });
      // Revision moved under us; re-read and retry.
    }
    return NextResponse.json({ error: "conflict, try again" }, { status: 409, headers: noStore });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e) }, { status: 500, headers: noStore });
  }
}
