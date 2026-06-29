"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, CalendarCheck, TrendingUp, Lock } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";

const GOOGLE_ERRORS: Record<string, string> = {
  no_account: "That Google account isn't a registered NIAT staff user. Contact your admin.",
  google_unverified: "Your Google email isn't verified.",
  google_cancelled: "Google sign-in was cancelled.",
  google_expired: "Sign-in session expired. Please try again.",
  google_failed: "Couldn't complete Google sign-in. Please try again.",
  google_unconfigured: "Google sign-in isn't available right now.",
};

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39 35.6 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const googleErr = search.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    googleErr ? GOOGLE_ERRORS[googleErr] || "Google sign-in failed." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = `/api/auth/google/start?next=${encodeURIComponent(next)}`;
  }

  return (
    <main className="min-h-[100dvh] grid lg:grid-cols-2 bg-white">
      {/* ── Left: brand panel ───────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FFB877] to-[#FF8A1E] p-12 text-white">
        {/* soft decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-1.5 backdrop-blur">
            <LogoMark size={40} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">NIAT SPI</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            The staff console for attendance, eligibility &amp; the Skill Performance Index.
          </h2>
          <p className="mt-4 text-white/85 leading-relaxed">
            One sign-in gives you live, role-scoped insight across every campus, section and learner.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: <CalendarCheck size={16} />, t: "Live attendance & eligibility, scoped to your role" },
              { icon: <TrendingUp size={16} />, t: "Campus, section and subject rollups at a glance" },
              { icon: <ShieldCheck size={16} />, t: "Secure 30-day sessions — sign in once" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">{f.icon}</span>
                <span className="text-white/90">{f.t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/70">© NIAT · Skill Performance Index</p>
      </div>

      {/* ── Right: form ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          {/* compact logo for mobile (left panel hidden) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark size={36} />
            <span className="text-lg font-extrabold tracking-tight text-gray-900">NIAT <span className="text-[#F25C05]">SPI</span></span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Staff sign in</h1>
          <p className="mt-1.5 text-sm text-gray-500">Welcome back — sign in to your console.</p>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-gray-400">
            <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="you@nxtwave.co.in" autoComplete="email" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Lock size={12} /> Authorized NIAT staff only · sessions last 30 days
          </p>
        </div>
      </div>
    </main>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
