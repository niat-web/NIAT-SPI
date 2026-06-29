import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { canManage, manageableRoles } from "@/lib/rbac";
import { type Role } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const session = await getSession();
  if (!session || !canManage(session.role)) return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Admins may not modify superadmins or other admins.
  if (session.role === "admin" && (target.role === "superadmin" || target.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, role, campuses, subjects, isActive, password } = body as {
    name?: string; role?: Role; campuses?: string[]; subjects?: string[]; isActive?: boolean; password?: string;
  };

  if (role && !manageableRoles(session.role).includes(role)) {
    return NextResponse.json({ error: "You cannot assign this role" }, { status: 403 });
  }
  if (name !== undefined) target.name = name;
  if (role !== undefined) target.role = role;
  if (campuses !== undefined) target.campuses = campuses;
  if (subjects !== undefined) target.subjects = subjects;
  if (isActive !== undefined) target.isActive = isActive;
  if (password) target.passwordHash = await bcrypt.hash(password, 10);
  await target.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "admin" && (target.role === "superadmin" || target.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (target._id.toString() === session.sub) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }
  await target.deleteOne();
  return NextResponse.json({ ok: true });
}
