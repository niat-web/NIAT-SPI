"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { pctColor, pctTextClass } from "@/lib/utils";
import FilterBar from "@/components/ui/FilterBar";
import FilterDrawer, { type FilterGroup, type FilterValue, countActive } from "@/components/ui/FilterDrawer";

interface CampusRow { instituteName: string; students: number; sections: number; subjects: number; attendancePercentage: number }
interface SectionRow { instituteName: string; batchSectionName: string; students: number; attendancePercentage: number }
interface Summary { campuses: CampusRow[]; sections: SectionRow[] }

const BANDS = [
  { value: "lt50", label: "Below 50%", test: (p: number) => p < 50 },
  { value: "lt80", label: "Below 80% (Recovery)", test: (p: number) => p < 80 },
  { value: "gte80", label: "80% and above", test: (p: number) => p >= 80 },
];

export default function CampusesClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({});

  useEffect(() => {
    fetch("/api/dashboard/summary").then((r) => (r.ok ? r.json() : null)).then(setData).finally(() => setLoading(false));
  }, []);

  const groups = useMemo<FilterGroup[]>(() => {
    const g: FilterGroup[] = [];
    const campuses = data?.campuses ?? [];
    if (campuses.length > 1) {
      g.push({
        key: "campus", label: "Campus", mode: "multi",
        options: campuses.map((c) => ({ value: c.instituteName, label: c.instituteName, count: c.sections })),
      });
    }
    g.push({
      key: "band", label: "Section attendance", mode: "single",
      options: BANDS.map((b) => ({ value: b.value, label: b.label, count: (data?.sections ?? []).filter((s) => b.test(s.attendancePercentage)).length })),
    });
    return g;
  }, [data]);

  const visibleCampuses = useMemo(() => {
    const list = data?.campuses ?? [];
    if (!filters.campus?.length) return list;
    return list.filter((c) => filters.campus.includes(c.instituteName));
  }, [data, filters]);

  const visibleSections = useMemo(() => {
    let list = data?.sections ?? [];
    if (filters.campus?.length) list = list.filter((s) => filters.campus.includes(s.instituteName));
    if (filters.band?.length) {
      const band = BANDS.find((b) => b.value === filters.band[0]);
      if (band) list = list.filter((s) => band.test(s.attendancePercentage));
    }
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter((s) => s.batchSectionName.toLowerCase().includes(t) || s.instituteName.toLowerCase().includes(t));
    }
    return list;
  }, [data, filters, q]);

  const chips = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = [];
    for (const [key, vals] of Object.entries(filters)) {
      for (const v of vals ?? []) {
        const label = key === "band" ? (BANDS.find((b) => b.value === v)?.label ?? v) : v;
        out.push({ key: key + v, label, onRemove: () => setFilters((f) => ({ ...f, [key]: (f[key] ?? []).filter((x) => x !== v) })) });
      }
    }
    return out;
  }, [filters]);

  if (loading) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <FilterBar search={q} onSearch={setQ} placeholder="Search sections…"
        onOpenFilters={() => setDrawer(true)} activeCount={countActive(filters)} chips={chips} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCampuses.map((c) => (
          <div key={c.instituteName} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Building2 size={17} /></div>
                <p className="font-semibold text-gray-900 text-sm leading-snug">{c.instituteName}</p>
              </div>
              <span className={`text-lg font-bold shrink-0 ${pctTextClass(c.attendancePercentage)}`}>{c.attendancePercentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-2 rounded-full" style={{ width: `${Math.min(c.attendancePercentage, 100)}%`, backgroundColor: pctColor(c.attendancePercentage) }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{c.students} students</span><span>{c.sections} sections</span><span>{c.subjects} subjects</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Section Breakdown</h2>
          <span className="text-xs text-gray-400">{visibleSections.length} of {data.sections.length} sections</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin max-h-[60vh]">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-y border-gray-100 bg-gray-50 sticky top-0">
              <th className="px-5 py-2.5 font-semibold">Campus</th>
              <th className="px-3 py-2.5 font-semibold">Section</th>
              <th className="px-3 py-2.5 font-semibold text-right">Students</th>
              <th className="px-5 py-2.5 font-semibold text-right">Attendance</th>
            </tr></thead>
            <tbody>
              {visibleSections.map((s) => (
                <tr key={s.instituteName + s.batchSectionName} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-gray-600">{s.instituteName}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{s.batchSectionName}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{s.students}</td>
                  <td className={`px-5 py-2.5 text-right font-bold ${pctTextClass(s.attendancePercentage)}`}>{s.attendancePercentage}%</td>
                </tr>
              ))}
              {visibleSections.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No sections match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} groups={groups} value={filters}
        onApply={setFilters} title="Filter campuses" />
    </div>
  );
}
