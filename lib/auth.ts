// Single shared password gate. SCAFFOLD_PASSWORD unlocks editing and project
// creation; anyone without it gets read-only. When the env var is unset
// (local dev), auth is disabled and everything stays editable.
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const COOKIE = "scaffold_auth";

const secret = () => process.env.SCAFFOLD_PASSWORD ?? "";

export const authEnabled = () => secret().length > 0;

// The cookie value is an HMAC keyed on the password itself, so rotating the
// password invalidates every existing session.
export function editToken(): string {
  return createHmac("sha256", secret()).update("scaffold-edit-v1").digest("hex");
}

export function checkPassword(pw: string): boolean {
  const a = Buffer.from(pw), b = Buffer.from(secret());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthed(req: NextRequest): boolean {
  if (!authEnabled()) return true;
  const c = req.cookies.get(COOKIE)?.value ?? "";
  const t = editToken();
  return c.length === t.length && timingSafeEqual(Buffer.from(c), Buffer.from(t));
}
