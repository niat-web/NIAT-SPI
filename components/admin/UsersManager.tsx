"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, ShieldCheck } from "lucide-react";
import { InlineLoader } from "@/components/ui/Loader";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";
import FilterBar from "@/components/ui/FilterBar";
import FilterDrawer, { type FilterGroup, type FilterValue, countActive } from "@/components/ui/FilterDrawer";

interface UserRow {
  id: string; name: string; email: string; role: Role;
  campuses: string[]; subjects: string[]; isActive: boolean; lastLoginAt?: string | null;
}
interface Meta { campuses: string[]; subjects: string[]; roles: { value: Role; label: string }[] }

const SUBJECT_ROLES: Role[] = ["capability_manager", "instructor"];
const CAMPUS_ROLES: Role[] = ["boa", "capability_manager", "instructor"];

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button type="button" key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300")}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function UserModal({
  meta, initial, onClose, onSaved,
}: { meta: Meta; initial: UserRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initial?.role ?? meta.roles[0]?.value ?? "instructor");
  const [campuses, setCampuses] = useState<string[]>(initial?.campuses ?? []);
  const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showCampus = CAMPUS_ROLES.includes(role);
  const showSubject = SUBJECT_ROLES.includes(role);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      const payload: Record<string, unknown> = { name, role, campuses: showCampus ? campuses : [], subjects: showSubject ? subjects : [] };
      if (!initial) { payload.email = email; payload.password = password; }
      else if (password) payload.password = password;

      const res = await fetch(initial ? `/api/admin/users/${initial.id}` : "/api/admin/users", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Save failed"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">{initial ? "Edit user" : "Add user"}</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Full name"><input required value={name} onChange={(e) => setName(e.target.value)} className="inp" /></Field>
          <Field label="Email">
            <input required type="email" value={email} disabled={!!initial} onChange={(e) => setEmail(e.target.value)}
              className={cn("inp", initial && "bg-gray-50 text-gray-400")} />
          </Field>
          <Field label={initial ? "New password (leave blank to keep)" : "Password"}>
            <input type="text" required={!initial} value={password} onChange={(e) => setPassword(e.target.value)} className="inp" placeholder={initial ? "••••••" : ""} />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="inp">
              {meta.roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          {showCampus && <Field label="Assigned campuses"><Chips options={meta.campuses} value={campuses} onChange={setCampuses} /></Field>}
          {showSubject && <Field label="Assigned subjects"><Chips options={meta.subjects} value={subjects} onChange={setSubjects} /></Field>}
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      <style jsx>{`:global(.inp){width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.55rem .75rem;font-size:.875rem;outline:none}:global(.inp:focus){box-shadow:0 0 0 2px #93c5fd}`}</style>
    </div>
  );
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({});

  const groups = useMemo<FilterGroup[]>(() => {
    const roleCounts = new Map<string, number>();
    const campusCounts = new Map<string, number>();
    for (const u of users) {
      roleCounts.set(u.role, (roleCounts.get(u.role) ?? 0) + 1);
      for (const c of u.campuses) campusCounts.set(c, (campusCounts.get(c) ?? 0) + 1);
    }
    const g: FilterGroup[] = [];
    if (roleCounts.size > 1) {
      g.push({
        key: "role", label: "Role", mode: "multi",
        options: [...roleCounts.entries()].map(([value, count]) => ({ value, label: ROLE_LABELS[value as Role] ?? value, count })),
      });
    }
    g.push({
      key: "status", label: "Status", mode: "single",
      options: [
        { value: "active", label: "Active", count: users.filter((u) => u.isActive).length },
        { value: "disabled", label: "Disabled", count: users.filter((u) => !u.isActive).length },
      ],
    });
    if (campusCounts.size > 1) {
      g.push({
        key: "campus", label: "Assigned campus", mode: "multi",
        options: [...campusCounts.entries()].sort().map(([value, count]) => ({ value, label: value, count })),
      });
    }
    return g;
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        if (!u.name.toLowerCase().includes(t) && !u.email.toLowerCase().includes(t)) return false;
      }
      if (filters.role?.length && !filters.role.includes(u.role)) return false;
      if (filters.status?.length) {
        const wantActive = filters.status[0] === "active";
        if (u.isActive !== wantActive) return false;
      }
      if (filters.campus?.length && !u.campuses.some((c) => filters.campus.includes(c))) return false;
      return true;
    });
  }, [users, q, filters]);

  const chips = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = [];
    for (const [key, vals] of Object.entries(filters)) {
      for (const v of vals ?? []) {
        const label = key === "role" ? (ROLE_LABELS[v as Role] ?? v) : key === "status" ? (v === "active" ? "Active" : "Disabled") : v;
        out.push({ key: key + v, label, onRemove: () => setFilters((f) => ({ ...f, [key]: (f[key] ?? []).filter((x) => x !== v) })) });
      }
    }
    return out;
  }, [filters]);

  async function load() {
    setLoading(true);
    const [u, m] = await Promise.all([
      fetch("/api/admin/users").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/meta").then((r) => (r.ok ? r.json() : null)),
    ]);
    setUsers(u); setMeta(m); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) load(); else alert((await res.json()).error || "Delete failed");
  }
  async function toggle(u: UserRow) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1">
          <FilterBar search={q} onSearch={setQ} placeholder="Search by name or email…"
            onOpenFilters={() => setDrawer(true)} activeCount={countActive(filters)} loading={loading} chips={chips} />
        </div>
        <button onClick={() => setModal({ open: true, user: null })} disabled={!meta}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60 shrink-0">
          <Plus size={16} /> Add user
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Scope</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={5} className="px-5"><InlineLoader /></td></tr>
                : filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3"><p className="font-medium text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></td>
                    <td className="px-3 py-3"><span className="inline-block rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5">{ROLE_LABELS[u.role]}</span></td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-[220px]">
                      {u.campuses.length || u.subjects.length
                        ? [...u.campuses, ...u.subjects].join(", ")
                        : <span className="text-gray-300">All</span>}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggle(u)} className={cn("text-xs font-semibold", u.isActive ? "text-green-600" : "text-gray-400")}>
                        {u.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => setModal({ open: true, user: u })} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => del(u.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">{users.length === 0 ? "No users yet." : "No users match your filters."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && meta && (
        <UserModal meta={meta} initial={modal.user} onClose={() => setModal({ open: false, user: null })}
          onSaved={() => { setModal({ open: false, user: null }); load(); }} />
      )}

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} groups={groups} value={filters}
        onApply={setFilters} title="Filter users" />
    </div>
  );
}
