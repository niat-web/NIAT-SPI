"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Building2 } from "lucide-react";
import { InlineLoader } from "@/components/ui/Loader";

interface CampusRow { id: string; name: string; instituteId: string; code: string; location: string; isActive: boolean }

export default function CampusesManager() {
  const [rows, setRows] = useState<CampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/campuses").then((r) => (r.ok ? r.json() : []));
    setRows(data); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setAdding(true);
    try {
      const res = await fetch("/api/admin/campuses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed"); return; }
      setName(""); setLocation(""); load();
    } finally { setAdding(false); }
  }
  async function del(id: string) {
    if (!confirm("Delete this campus?")) return;
    await fetch(`/api/admin/campuses/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campus name (must match institute_name)</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" placeholder="e.g. NIAT Chevella" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location (optional)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <button type="submit" disabled={adding}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60">
          {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />} Add
        </button>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? <InlineLoader /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 font-semibold">Campus</th><th className="px-3 py-3 font-semibold">Location</th><th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800 flex items-center gap-2"><Building2 size={15} className="text-brand-500" />{c.name}</td>
                  <td className="px-3 py-3 text-gray-500">{c.location || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => del(c.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400">No campuses yet — add one above.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
