import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, sessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE, type Role } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = (body.email ?? "").toLowerCase().trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ email, isActive: true });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createToken({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as Role,
    campuses: user.campuses ?? [],
    subjects: user.subjects ?? [],
  });

  cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
  user.lastLoginAt = new Date();
  await user.save();

  return NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role },
  });
}
