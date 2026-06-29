"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RTooltip, CartesianGrid,
  PieChart, Pie,
} from "recharts";
import {
  Building2, GraduationCap, BookOpen, AlertTriangle, RefreshCw, TrendingUp, Layers, ArrowUpRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageLoader } from "@/components/ui/Loader";
import { pctColor, pctTextClass } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface CampusRow { instituteName: string; students: number; sections: number; subjects: number; attendancePercentage: number; presentSessions: number; totalSessions: number }
interface SubjectRow { subjectTitle: string; students: number; attendancePercentage: number }
interface SectionRow { instituteName: string; batchSectionName: string; students: number; attendancePercentage: number }
interface Summary { campuses: CampusRow[]; subjects: SubjectRow[]; sections: SectionRow[]; syncedAt?: string | null }

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, hint, tone = "gray",
}: {
  icon: React.ReactNode; label: string; value: string; hint?: string;
  tone?: "gray" | "brand" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-500",
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// Mini progress ring for the overall-attendance card.
function Ring({ pct, size = 60 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  const color = pctColor(pct);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function Bar2({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pctColor(pct) }} />
    </div>
  );
}

export default function OverviewClient({ firstName, role, scopeLabel }: { firstName: string; role: Role; scopeLabel: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error || "Failed"); return r.json(); })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // Re-render every 30s so the "updated X ago" label stays current.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const totalStudents = data.campuses.reduce((a, c) => a + c.students, 0);
    const totalPresent = data.campuses.reduce((a, c) => a + c.presentSessions, 0);
    const totalSessions = data.campuses.reduce((a, c) => a + c.totalSessions, 0);
    const overallPct = totalSessions ? Math.round((totalPresent / totalSessions) * 1000) / 10 : 0;

    // Health buckets across subjects.
    const healthy = data.subjects.filter((s) => s.attendancePercentage >= 80).length;
    const warning = data.subjects.filter((s) => s.attendancePercentage >= 65 && s.attendancePercentage < 80).length;
    const critical = data.subjects.filter((s) => s.attendancePercentage < 65).length;
    const recoverySubjects = warning + critical; // anything below 80

    const chartData = [...data.subjects]
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
      .map((s) => ({
        name: s.subjectTitle.length > 16 ? s.subjectTitle.slice(0, 15) + "…" : s.subjectTitle,
        full: s.subjectTitle, pct: s.attendancePercentage,
      }));

    const worst = [...data.subjects].sort((a, b) => a.attendancePercentage - b.attendancePercentage).slice(0, 5);
    const donut = [
      { name: "Healthy ≥80%", value: healthy, color: "#22c55e" },
      { name: "Warning 65–79%", value: warning, color: "#f59e0b" },
      { name: "Critical <65%", value: critical, color: "#ef4444" },
    ].filter((d) => d.value > 0);

    return { totalStudents, overallPct, recoverySubjects, chartData, worst, donut };
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Couldn&apos;t load data: {error}</div>;
  if (!data || !derived) return null;

  const { totalStudents, overallPct, recoverySubjects, chartData, worst, donut } = derived;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome, {firstName}</h1>
          <p className="mt-1 text-sm text-gray-500">Live attendance &amp; eligibility across your scope. Scores and SPI components arrive soon.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            {ROLE_LABELS[role]} · {scopeLabel}
          </span>
          {data.syncedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-medium text-green-700" title={new Date(data.syncedAt).toLocaleString()}>
              <RefreshCw size={11} /> Data updated {formatDistanceToNow(new Date(data.syncedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard tone="brand" icon={<GraduationCap size={17} />} label="Students" value={totalStudents.toLocaleString()} hint="in scope" />
        <StatCard tone="gray" icon={<Building2 size={17} />} label="Campuses" value={String(data.campuses.length)} hint={`${data.sections.length} sections`} />
        {/* Overall attendance with ring */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <Ring pct={overallPct} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Avg Attendance</p>
            <p className={`text-xl font-bold ${pctTextClass(overallPct)}`}>{overallPct}%</p>
            <p className="text-xs text-gray-400">across sessions</p>
          </div>
        </div>
        <StatCard tone="red" icon={<AlertTriangle size={17} />} label="Subjects < 80%" value={String(recoverySubjects)} hint="need recovery" />
      </div>

      {/* Insight row: chart + distribution/worst */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Subject attendance chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" />
            <h2 className="text-base font-semibold text-gray-900">Attendance by Subject</h2>
            <span className="ml-auto text-xs text-gray-400">lowest first</span>
          </div>
          <div style={{ width: "100%", height: Math.max(240, chartData.length * 34) }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <RTooltip formatter={(v: number) => [`${v}%`, "Attendance"]} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ""} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={pctColor(d.pct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution donut + worst subjects */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Layers size={16} className="text-brand-600" />
              <h2 className="text-base font-semibold text-gray-900">Subject Health</h2>
            </div>
            <div className="flex items-center gap-4">
              <div style={{ width: 110, height: 110 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={32} outerRadius={52} paddingAngle={2} stroke="none">
                      {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <RTooltip formatter={(v: number, n) => [`${v}`, n as string]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-sm">
                {donut.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="text-base font-semibold text-gray-900">Needs Attention</h2>
            </div>
            <ul className="space-y-3">
              {worst.map((s) => (
                <li key={s.subjectTitle}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-gray-700">{s.subjectTitle}</span>
                    <span className={`shrink-0 text-sm font-bold ${pctTextClass(s.attendancePercentage)}`}>{s.attendancePercentage}%</span>
                  </div>
                  <Bar2 pct={s.attendancePercentage} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Campus table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <Building2 size={16} className="text-brand-600" />
          <h2 className="text-base font-semibold text-gray-900">Campus Breakdown</h2>
          <span className="ml-auto text-xs text-gray-400">{data.campuses.length} campuses</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-y border-gray-100 bg-gray-50">
              <th className="px-5 py-2.5 font-semibold">Campus</th>
              <th className="px-3 py-2.5 font-semibold text-right">Students</th>
              <th className="px-3 py-2.5 font-semibold text-right">Sections</th>
              <th className="px-3 py-2.5 font-semibold text-right">Subjects</th>
              <th className="px-5 py-2.5 font-semibold w-56">Attendance</th>
            </tr></thead>
            <tbody>
              {data.campuses.map((c) => (
                <tr key={c.instituteName} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: pctColor(c.attendancePercentage) }} />
                      {c.instituteName}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.students}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.sections}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.subjects}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1"><Bar2 pct={c.attendancePercentage} /></div>
                      <span className={`w-12 text-right text-sm font-bold ${pctTextClass(c.attendancePercentage)}`}>{c.attendancePercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a href="/dashboard/campuses" className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50/40 transition-colors">
          View full campus &amp; section breakdown <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
}
