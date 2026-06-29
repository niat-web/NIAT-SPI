import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getSession, createToken, sessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE, ROLE_LABELS, type Role } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const u = await User.findById(session.sub).lean();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    name: u.name, email: u.email, role: u.role, roleLabel: ROLE_LABELS[u.role as Role],
    campuses: u.campuses ?? [], subjects: u.subjects ?? [], lastLoginAt: u.lastLoginAt,
  });
}

// Self-service profile update: name + password only (role/scope stay admin-managed).
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, currentPassword, newPassword } = body as {
    name?: string; currentPassword?: string; newPassword?: string;
  };

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const nameChanged = name !== undefined && name.trim() && name.trim() !== user.name;
  if (nameChanged) user.name = name!.trim();
  await user.save();

  // Refresh the session cookie so the new name shows immediately.
  if (nameChanged) {
    const token = await createToken({
      sub: user._id.toString(), email: user.email, name: user.name,
      role: user.role as Role, campuses: user.campuses ?? [], subjects: user.subjects ?? [],
    });
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
  }

  return NextResponse.json({ ok: true });
}
