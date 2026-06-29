import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTables } from "@/lib/bigquery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const dataset = new URL(req.url).searchParams.get("dataset");
  if (!dataset) return NextResponse.json({ error: "dataset is required" }, { status: 400 });
  try {
    return NextResponse.json(await listTables(dataset));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
