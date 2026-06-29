"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle2, User as UserIcon } from "lucide-react";
import { PageLoader } from "@/components/ui/Loader";

interface Profile {
  name: string; email: string; role: string; roleLabel: string;
  campuses: string[]; subjects: string[]; lastLoginAt?: string | null;
}

export default function ProfileForm() {
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d) { setP(d); setName(d.name); }
    }).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setSaving(true);
    try {
      const body: Record<string, string> = { name };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
      const res = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error || "Update failed" }); return; }
      setMsg({ type: "ok", text: "Profile updated successfully." });
      setCurrentPassword(""); setNewPassword("");
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  if (!p) return <p className="text-sm text-gray-400">Couldn&apos;t load your profile.</p>;

  const scope = [...p.campuses, ...p.subjects];

  return (
    <div className="max-w-xl space-y-5">
      {/* Identity card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
          {p.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900">{p.name}</p>
          <p className="text-sm text-gray-500">{p.email}</p>
          <span className="inline-block mt-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5">{p.roleLabel}</span>
        </div>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input value={p.email} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 text-gray-400 px-3 py-2.5 text-sm" />
          <p className="text-[11px] text-gray-400 mt-1">Email is managed by an administrator.</p>
        </div>

        {scope.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your scope</label>
            <div className="flex flex-wrap gap-1.5">
              {scope.map((s) => <span key={s} className="rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs px-2.5 py-1">{s}</span>)}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Change password</p>
          <div className="space-y-3">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password" autoComplete="current-password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (leave blank to keep current)" autoComplete="new-password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
        </div>

        {msg && (
          <p className={msg.type === "ok"
            ? "flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
            : "text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"}>
            {msg.type === "ok" && <CheckCircle2 size={15} />}{msg.text}
          </p>
        )}

        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
        </button>
      </form>
    </div>
  );
}
