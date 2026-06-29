import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import { canManage, manageableRoles } from "@/lib/rbac";
import { ROLES, type Role } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  // Admins see everyone except superadmins; superadmin sees all.
  const filter = session.role === "admin" ? { role: { $ne: "superadmin" } } : {};
  const users = await User.find(filter).sort({ role: 1, name: 1 }).lean();
  return NextResponse.json(
    users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      campuses: u.campuses ?? [],
      subjects: u.subjects ?? [],
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
    })),
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { name, email, password, role, campuses = [], subjects = [] } = body as {
    name: string; email: string; password: string; role: Role;
    campuses?: string[]; subjects?: string[];
  };

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "name, email, password and role are required" }, { status: 400 });
  }
  if (!ROLES.includes(role) || !manageableRoles(session.role).includes(role)) {
    return NextResponse.json({ error: "You cannot create a user with this role" }, { status: 403 });
  }

  await connectDB();
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name, email: email.toLowerCase().trim(), passwordHash, role,
    campuses, subjects, createdBy: session.email,
  });
  return NextResponse.json({ id: user._id.toString() }, { status: 201 });
}
