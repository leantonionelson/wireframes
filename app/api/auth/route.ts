import { NextRequest, NextResponse } from "next/server";
import { COOKIE, authEnabled, checkPassword, editToken, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "no-store" };

export async function GET(req: NextRequest) {
  return NextResponse.json({ enabled: authEnabled(), authed: isAuthed(req) }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };
  if (!authEnabled()) return NextResponse.json({ authed: true }, { headers: noStore });
  if (!password || !checkPassword(password)) {
    return NextResponse.json({ authed: false, error: "wrong password" }, { status: 401, headers: noStore });
  }
  const res = NextResponse.json({ authed: true }, { headers: noStore });
  res.cookies.set(COOKIE, editToken(), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ authed: false }, { headers: noStore });
  res.cookies.set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
