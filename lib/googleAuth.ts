import { SignJWT, jwtVerify } from "jose";

// ── Google OAuth 2.0 (Authorization Code flow) ────────────────────────────
// Staff-console policy: Google sign-in only authenticates users that ALREADY
// exist as active staff accounts (matched by email). It never creates users.

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-insecure-secret-change-me",
);

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** The exact redirect URI Google calls back to — must be whitelisted in the
 *  Google Cloud console. Derived from the app URL so it works in every env. */
export function googleRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Short-lived signed state to carry the post-login redirect + CSRF protection.
export async function signState(next: string): Promise<string> {
  return new SignJWT({ next })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyState(state: string): Promise<{ next: string } | null> {
  try {
    const { payload } = await jwtVerify(state, secret);
    return { next: typeof payload.next === "string" ? payload.next : "/dashboard" };
  } catch {
    return null;
  }
}

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

/** Exchange the auth code for tokens, then read the verified profile. */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }).toString(),
  });
  const token = (await tokenRes.json()) as GoogleTokenResponse;
  if (!token.access_token) {
    throw new Error(token.error_description || token.error || "Google token exchange failed");
  }

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const info = (await infoRes.json()) as {
    email?: string; email_verified?: boolean; name?: string; picture?: string; error?: unknown;
  };
  if (!info.email) throw new Error("Could not read Google profile email");

  return {
    email: info.email.toLowerCase(),
    emailVerified: Boolean(info.email_verified),
    name: info.name || info.email,
    picture: info.picture,
  };
}
