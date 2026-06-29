import { createHmac, timingSafeEqual } from "crypto";

// ── Signed share-links for student SPI reports ────────────────────────────
// A /spi/<id> page is only viewable with a valid token: /spi/<id>?t=<token>.
// The token is a short HMAC of the student id, so only links the app generated
// work — raw or guessed ids are rejected. Logged-in staff bypass the token.

const secret = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

export function signSpiToken(studentId: string): string {
  return createHmac("sha256", secret)
    .update(`spi:${studentId}`)
    .digest("base64url");
}

export function verifySpiToken(studentId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = signSpiToken(studentId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  // Constant-time compare; lengths must match first.
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Relative share path for a student, e.g. "/spi/<id>?t=<token>". */
export function spiSharePath(studentId: string): string {
  return `/spi/${encodeURIComponent(studentId)}?t=${signSpiToken(studentId)}`;
}
