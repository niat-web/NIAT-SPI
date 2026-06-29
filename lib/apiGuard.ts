import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";
import { canManage } from "./rbac";
import { verifySpiToken } from "./spiToken";
import { clientIp, rateLimit } from "./rateLimit";

// ── Centralized API guards + safe error handling (IMP-4, IMP-5) ───────────

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a handler so thrown errors never leak internals to the client. */
export async function safe<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (e) {
    // Log full detail server-side; return a generic message to the client.
    console.error("[api] unhandled error:", e);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** Require a valid staff session. Returns the session or a 401/403 response. */
export async function requireSession(opts?: { manage?: boolean }): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (opts?.manage && !canManage(session.role)) return jsonError("Forbidden", 403);
  return session;
}

/** Require a specific role. */
export async function requireRole(role: SessionPayload["role"]): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.role !== role) return jsonError("Forbidden", 403);
  return session;
}

/**
 * Allow a student SPI request if EITHER a valid share token is present OR the
 * caller is a logged-in staff member. Returns null when allowed, or a response.
 */
export async function allowSpiAccess(req: Request, studentId: string): Promise<NextResponse | null> {
  // Throttle public report access to blunt bulk scraping (IMP-6): 60/min/IP.
  const limit = rateLimit(`spi:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  const token = new URL(req.url).searchParams.get("t");
  if (verifySpiToken(studentId, token)) return null;
  const session = await getSession();
  if (session) return null;
  return jsonError("This report link is invalid or has expired.", 403);
}
