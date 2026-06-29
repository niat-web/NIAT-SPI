import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campus } from "@/models/Campus";
import { getSession } from "@/lib/auth";
import { canManage } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const c = await Campus.findById(params.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  for (const k of ["name", "instituteId", "code", "location", "isActive"] as const) {
    if (body[k] !== undefined) (c as unknown as Record<string, unknown>)[k] = body[k];
  }
  await c.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  await Campus.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
