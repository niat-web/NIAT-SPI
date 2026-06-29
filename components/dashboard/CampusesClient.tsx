"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageLoader } from "@/components/ui/Loader";
import { pctTextClass, cn } from "@/lib/utils";
import { objectsToCsv, downloadCsv } from "@/lib/csv";
import FilterBar from "@/components/ui/FilterBar";
import FilterDrawer, { type FilterGroup, type FilterValue, countActive } from "@/components/ui/FilterDrawer";

interface CampusRow { instituteName: string; students: number; sections: number; subjects: number; attendancePercentage: number }
interface SectionRow { instituteName: string; batchSectionName: string; students: number; attendancePercentage: number }
interface Summary { campuses: CampusRow[]; sections: SectionRow[] }

type View = "section" | "campus";

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
  const [view, setView] = useState<View>("section");

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
      key: "band", label: "Attendance", mode: "single",
      options: BANDS.map((b) => ({
        value: b.value, label: b.label,
        count: (view === "campus" ? data?.campuses ?? [] : data?.sections ?? []).filter((r) => b.test(r.attendancePercentage)).length,
      })),
    });
    return g;
  }, [data, view]);

  const sectionRows = useMemo(() => {
    let list = data?.sections ?? [];
    if (filters.campus?.length) list = list.filter((s) => filters.campus.includes(s.instituteName));
    if (filters.band?.length) { const b = BANDS.find((x) => x.value === filters.band[0]); if (b) list = list.filter((s) => b.test(s.attendancePercentage)); }
    if (q.trim()) { const t = q.trim().toLowerCase(); list = list.filter((s) => s.batchSectionName.toLowerCase().includes(t) || s.instituteName.toLowerCase().includes(t)); }
    return list;
  }, [data, filters, q]);

  const campusRows = useMemo(() => {
    let list = data?.campuses ?? [];
    if (filters.campus?.length) list = list.filter((c) => filters.campus.includes(c.instituteName));
    if (filters.band?.length) { const b = BANDS.find((x) => x.value === filters.band[0]); if (b) list = list.filter((c) => b.test(c.attendancePercentage)); }
    if (q.trim()) { const t = q.trim().toLowerCase(); list = list.filter((c) => c.instituteName.toLowerCase().includes(t)); }
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

  function exportCsv() {
    const date = new Date().toISOString().slice(0, 10);
    if (view === "campus") {
      const csv = objectsToCsv(
        campusRows.map((c) => ({ campus: c.instituteName, sections: c.sections, subjects: c.subjects, students: c.students, attendance: `${c.attendancePercentage}%` })),
        [
          { key: "campus", label: "Campus" }, { key: "sections", label: "Sections" },
          { key: "subjects", label: "Subjects" }, { key: "students", label: "Students" },
          { key: "attendance", label: "Attendance %" },
        ],
      );
      downloadCsv(`campuses-${date}.csv`, csv);
    } else {
      const csv = objectsToCsv(
        sectionRows.map((s) => ({ campus: s.instituteName, section: s.batchSectionName, students: s.students, attendance: `${s.attendancePercentage}%` })),
        [
          { key: "campus", label: "Campus" }, { key: "section", label: "Section" },
          { key: "students", label: "Students" }, { key: "attendance", label: "Attendance %" },
        ],
      );
      downloadCsv(`sections-${date}.csv`, csv);
    }
  }

  if (loading) return <PageLoader />;
  if (!data) return null;

  const total = view === "campus" ? data.campuses.length : data.sections.length;
  const shown = view === "campus" ? campusRows.length : sectionRows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1"><FilterBar search={q} onSearch={setQ} placeholder={view === "campus" ? "Search campuses…" : "Search sections…"}
          onOpenFilters={() => setDrawer(true)} activeCount={countActive(filters)} chips={chips} /></div>
        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shrink-0">
          {(["section", "campus"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                view === v ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50")}>
              {v === "section" ? "By section" : "By campus"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-base font-semibold text-gray-900">{view === "campus" ? "Campus Breakdown" : "Section Breakdown"}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{shown} of {total} {view === "campus" ? "campuses" : "sections"}</span>
            <button type="button" onClick={exportCsv} disabled={!shown}
              title="Export current view to CSV"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin max-h-[68vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-y border-gray-100 bg-gray-50 sticky top-0">
                <th className="px-5 py-2.5 font-semibold">Campus</th>
                {view === "section" && <th className="px-3 py-2.5 font-semibold">Section</th>}
                {view === "campus" && <th className="px-3 py-2.5 font-semibold text-right">Sections</th>}
                {view === "campus" && <th className="px-3 py-2.5 font-semibold text-right">Subjects</th>}
                <th className="px-3 py-2.5 font-semibold text-right">Students</th>
                <th className="px-5 py-2.5 font-semibold text-right">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {view === "section"
                ? sectionRows.map((s) => (
                  <tr key={s.instituteName + s.batchSectionName} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-600">{s.instituteName}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{s.batchSectionName}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{s.students}</td>
                    <td className={`px-5 py-2.5 text-right font-bold ${pctTextClass(s.attendancePercentage)}`}>{s.attendancePercentage}%</td>
                  </tr>
                ))
                : campusRows.map((c) => (
                  <tr key={c.instituteName} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-gray-800">{c.instituteName}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{c.sections}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{c.subjects}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{c.students}</td>
                    <td className={`px-5 py-2.5 text-right font-bold ${pctTextClass(c.attendancePercentage)}`}>{c.attendancePercentage}%</td>
                  </tr>
                ))}
              {shown === 0 && (
                <tr><td colSpan={view === "campus" ? 5 : 4} className="px-5 py-10 text-center text-gray-400">No {view === "campus" ? "campuses" : "sections"} match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} groups={groups} value={filters}
        onApply={setFilters} title="Filter campuses" />
    </div>
  );
}
