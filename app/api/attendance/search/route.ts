import { NextResponse } from "next/server";
import { scopeForSession } from "@/lib/rbac";
import { searchStudents } from "@/lib/queriesDb";
import { requireSession, safe } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 20);

  return safe(async () => {
    const data = await searchStudents(q, limit, scopeForSession(session));
    return NextResponse.json(data);
  });
}
