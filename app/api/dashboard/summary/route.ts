import { NextResponse } from "next/server";
import { scopeForSession } from "@/lib/rbac";
import { getDashboardSummary } from "@/lib/queriesDb";
import { withCache } from "@/lib/cache";
import { requireSession, safe } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const scope = scopeForSession(session);
  const key = `summary:${session.role}:${(scope.campuses ?? []).join(",")}:${(scope.subjects ?? []).join(",")}`;
  return safe(async () => {
    const data = await withCache(key, () => getDashboardSummary(scope), 60 * 1000);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120" },
    });
  });
}
