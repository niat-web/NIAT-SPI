import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scopeForSession } from "@/lib/rbac";
import { getStudentsList } from "@/lib/queriesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 200);

  const scope = scopeForSession(session);
  try {
    const data = await getStudentsList(scope, { search, limit });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
