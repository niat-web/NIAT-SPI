import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured, signState } from "@/lib/googleAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const state = await signState(next);
  return NextResponse.redirect(googleAuthUrl(state));
}
