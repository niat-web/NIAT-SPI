import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scopeForSession } from "@/lib/rbac";
import { getDashboardSummary } from "@/lib/queriesDb";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = scopeForSession(session);
  const key = `summary:${session.role}:${(scope.campuses ?? []).join(",")}:${(scope.subjects ?? []).join(",")}`;
  try {
    const data = await withCache(key, () => getDashboardSummary(scope), 60 * 1000);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
