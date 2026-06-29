"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RTooltip, CartesianGrid,
} from "recharts";
import { Building2, GraduationCap, BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageLoader } from "@/components/ui/Loader";
import { pctColor, pctTextClass } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface CampusRow { instituteName: string; students: number; sections: number; subjects: number; attendancePercentage: number; presentSessions: number; totalSessions: number }
interface SubjectRow { subjectTitle: string; students: number; attendancePercentage: number }
interface SectionRow { instituteName: string; batchSectionName: string; students: number; attendancePercentage: number }
interface Summary { campuses: CampusRow[]; subjects: SubjectRow[]; sections: SectionRow[]; syncedAt?: string | null }

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}<span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function OverviewClient({ role, scopeLabel }: { role: Role; scopeLabel: string }) {
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

  if (loading) {
    return <PageLoader />;
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Couldn&apos;t load data: {error}</div>;
  if (!data) return null;

  const totalStudents = data.campuses.reduce((a, c) => a + c.students, 0);
  const totalPresent = data.campuses.reduce((a, c) => a + c.presentSessions, 0);
  const totalSessions = data.campuses.reduce((a, c) => a + c.totalSessions, 0);
  const overallPct = totalSessions ? Math.round((totalPresent / totalSessions) * 1000) / 10 : 0;
  const recoverySubjects = data.subjects.filter((s) => s.attendancePercentage < 80).length;

  const chartData = data.subjects.map((s) => ({
    name: s.subjectTitle.length > 16 ? s.subjectTitle.slice(0, 15) + "…" : s.subjectTitle,
    full: s.subjectTitle, pct: s.attendancePercentage,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {ROLE_LABELS[role]} · {scopeLabel}
        </span>
        {data.syncedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-medium text-green-700" title={new Date(data.syncedAt).toLocaleString()}>
            <RefreshCw size={11} /> Data updated {formatDistanceToNow(new Date(data.syncedAt), { addSuffix: true })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<GraduationCap size={15} />} label="Students" value={totalStudents.toLocaleString()} hint="in scope" />
        <StatCard icon={<Building2 size={15} />} label="Campuses" value={String(data.campuses.length)} />
        <StatCard icon={<BookOpen size={15} />} label="Avg Attendance" value={`${overallPct}%`} hint="across sessions" />
        <StatCard icon={<AlertTriangle size={15} />} label="Subjects < 80%" value={String(recoverySubjects)} hint="need recovery" />
      </div>

      {/* Subject attendance chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Attendance by Subject</h2>
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

      {/* Campus table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <h2 className="text-base font-semibold text-gray-900 px-5 pt-5 pb-3">Campus Breakdown</h2>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-y border-gray-100 bg-gray-50">
              <th className="px-5 py-2.5 font-semibold">Campus</th>
              <th className="px-3 py-2.5 font-semibold text-right">Students</th>
              <th className="px-3 py-2.5 font-semibold text-right">Sections</th>
              <th className="px-3 py-2.5 font-semibold text-right">Subjects</th>
              <th className="px-5 py-2.5 font-semibold text-right">Attendance</th>
            </tr></thead>
            <tbody>
              {data.campuses.map((c) => (
                <tr key={c.instituteName} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{c.instituteName}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.students}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.sections}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{c.subjects}</td>
                  <td className={`px-5 py-3 text-right font-bold ${pctTextClass(c.attendancePercentage)}`}>{c.attendancePercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
