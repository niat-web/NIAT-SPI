import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campus } from "@/models/Campus";
import { getSession } from "@/lib/auth";
import { canManage } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const campuses = await Campus.find().sort({ name: 1 }).lean();
  return NextResponse.json(campuses.map((c) => ({
    id: c._id.toString(), name: c.name, instituteId: c.instituteId, code: c.code, location: c.location, isActive: c.isActive,
  })));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  await connectDB();
  const exists = await Campus.findOne({ name: body.name.trim() });
  if (exists) return NextResponse.json({ error: "Campus already exists" }, { status: 409 });
  const c = await Campus.create({
    name: body.name.trim(), instituteId: body.instituteId ?? "", code: body.code ?? "", location: body.location ?? "",
  });
  return NextResponse.json({ id: c._id.toString() }, { status: 201 });
}
