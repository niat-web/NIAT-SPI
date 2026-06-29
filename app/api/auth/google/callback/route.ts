import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, sessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE, type Role } from "@/lib/constants";
import { exchangeCodeForProfile, googleConfigured, verifyState } from "@/lib/googleAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loginRedirect(req: Request, params: Record<string, string>) {
  const base = new URL("/staff-login", new URL(req.url).origin);
  for (const [k, v] of Object.entries(params)) base.searchParams.set(k, v);
  return NextResponse.redirect(base);
}

export async function GET(req: Request) {
  if (!googleConfigured()) return loginRedirect(req, { error: "google_unconfigured" });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code || !state) {
    return loginRedirect(req, { error: "google_cancelled" });
  }

  const parsedState = await verifyState(state);
  if (!parsedState) return loginRedirect(req, { error: "google_expired" });

  let profile;
  try {
    profile = await exchangeCodeForProfile(code);
  } catch {
    return loginRedirect(req, { error: "google_failed" });
  }
  if (!profile.emailVerified) return loginRedirect(req, { error: "google_unverified" });

  // Staff console: only sign in emails that already exist as active users.
  await connectDB();
  const user = await User.findOne({ email: profile.email, isActive: true });
  if (!user) return loginRedirect(req, { error: "no_account" });

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

  const next = parsedState.next.startsWith("/") ? parsedState.next : "/dashboard";
  return NextResponse.redirect(new URL(next, url.origin));
}
