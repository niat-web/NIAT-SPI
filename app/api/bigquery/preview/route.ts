import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTablePreview } from "@/lib/bigquery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sp = new URL(req.url).searchParams;
  const dataset = sp.get("dataset");
  const table = sp.get("table");
  const limit = Number(sp.get("limit") ?? 50);
  if (!dataset || !table) return NextResponse.json({ error: "dataset and table are required" }, { status: 400 });
  try {
    return NextResponse.json(await getTablePreview(dataset, table, limit));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
