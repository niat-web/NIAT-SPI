"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { pctTextClass } from "@/lib/utils";
import FilterBar from "@/components/ui/FilterBar";
import FilterDrawer, { type FilterGroup, type FilterValue, countActive } from "@/components/ui/FilterDrawer";

interface Row {
  studentUserId: string; studentName: string; instituteName: string;
  batchSectionName: string; attendancePercentage: number; presentSessions: number; totalSessions: number;
}

const BANDS = [
  { value: "lt50", label: "Below 50%", test: (p: number) => p < 50 },
  { value: "lt80", label: "Below 80% (Recovery)", test: (p: number) => p < 80 },
  { value: "gte80", label: "80% and above", test: (p: number) => p >= 80 },
];

export default function StudentsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({});
  const [pageSize, setPageSize] = useState(200);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"default" | "high" | "low">("default");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const url = `/api/dashboard/students?limit=5000${debounced ? `&q=${encodeURIComponent(debounced)}` : ""}`;
    fetch(url).then((r) => (r.ok ? r.json() : [])).then(setRows).finally(() => setLoading(false));
  }, [debounced]);

  // Build adaptive filter groups from the loaded rows.
  const groups = useMemo<FilterGroup[]>(() => {
    const campusCounts = new Map<string, number>();
    const sectionCounts = new Map<string, number>();
    for (const r of rows) {
      campusCounts.set(r.instituteName, (campusCounts.get(r.instituteName) ?? 0) + 1);
      sectionCounts.set(r.batchSectionName, (sectionCounts.get(r.batchSectionName) ?? 0) + 1);
    }
    const g: FilterGroup[] = [];
    if (campusCounts.size > 1) {
      g.push({
        key: "campus", label: "Campus", mode: "multi",
        options: [...campusCounts.entries()].sort().map(([value, count]) => ({ value, label: value, count })),
      });
    }
    if (sectionCounts.size > 1) {
      g.push({
        key: "section", label: "Section", mode: "multi",
        options: [...sectionCounts.entries()].sort().map(([value, count]) => ({ value, label: value, count })),
      });
    }
    g.push({
      key: "band", label: "Attendance", mode: "single",
      options: BANDS.map((b) => ({ value: b.value, label: b.label, count: rows.filter((r) => b.test(r.attendancePercentage)).length })),
    });
    return g;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.campus?.length && !filters.campus.includes(r.instituteName)) return false;
      if (filters.section?.length && !filters.section.includes(r.batchSectionName)) return false;
      if (filters.band?.length) {
        const band = BANDS.find((b) => b.value === filters.band[0]);
        if (band && !band.test(r.attendancePercentage)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => {
    if (sort === "high") return [...filtered].sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    if (sort === "low") return [...filtered].sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    return filtered; // default — as returned by the server
  }, [filtered, sort]);

  // Reset to first page whenever the result set, sort or page size changes.
  useEffect(() => { setPage(1); }, [debounced, filters, pageSize, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize),
    [sorted, pageSafe, pageSize],
  );

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

  return (
    <div className="space-y-4">
      <FilterBar
        search={q} onSearch={setQ} placeholder="Search students by name…"
        onOpenFilters={() => setDrawer(true)} activeCount={countActive(filters)} loading={loading} chips={chips}
        rightSlot={
          <select value={sort} onChange={(e) => setSort(e.target.value as "default" | "high" | "low")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="default">Sort: Default</option>
            <option value="high">Attendance: High to Low</option>
            <option value="low">Attendance: Low to High</option>
          </select>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-3 py-3 font-semibold">Campus</th>
              <th className="px-3 py-3 font-semibold">Section</th>
              <th className="px-3 py-3 font-semibold text-right">Attendance</th>
              <th className="px-5 py-3 font-semibold text-right">Report</th>
            </tr></thead>
            <tbody>
              {loading && rows.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                : paged.map((r) => (
                    <tr key={r.studentUserId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{r.studentName}</td>
                      <td className="px-3 py-3 text-gray-500">{r.instituteName}</td>
                      <td className="px-3 py-3 text-gray-500">{r.batchSectionName}</td>
                      <td className={`px-3 py-3 text-right font-bold ${pctTextClass(r.attendancePercentage)}`}>
                        {r.attendancePercentage}%
                        <span className="ml-1 text-[11px] font-normal text-gray-400">({r.presentSessions}/{r.totalSessions})</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/spi/${r.studentUserId}`} target="_blank"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold">
                          Open <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No students match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value={200}>200 / page</option>
            <option value={500}>500 / page</option>
            <option value={1000}>1000 / page</option>
          </select>
          <span className="text-sm text-gray-400">{filtered.length.toLocaleString()} total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Page {pageSafe} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            ← Prev
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Next →
          </button>
        </div>
      </div>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} groups={groups} value={filters}
        onApply={setFilters} title="Filter students" />
    </div>
  );
}
