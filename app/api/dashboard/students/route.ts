import { NextResponse } from "next/server";
import { scopeForSession } from "@/lib/rbac";
import { getStudentsList } from "@/lib/queriesDb";
import { requireSession, safe } from "@/lib/apiGuard";
import { spiSharePath } from "@/lib/spiToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 200);

  const scope = scopeForSession(session);
  return safe(async () => {
    const data = await getStudentsList(scope, { search, limit });
    // Attach a signed share-link so staff "Open" buttons work without exposing
    // raw public URLs (BUG-1).
    const withLinks = data.map((r) => ({ ...r, spiPath: spiSharePath(r.studentUserId) }));
    return NextResponse.json(withLinks);
  });
}
