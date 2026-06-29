import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scopeForSession } from "@/lib/rbac";
import { searchStudents } from "@/lib/queriesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 20);

  try {
    const data = await searchStudents(q, limit, scopeForSession(session));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
