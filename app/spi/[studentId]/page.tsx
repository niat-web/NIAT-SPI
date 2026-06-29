"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, RefreshCw, BookOpen, Briefcase, Users, Star,
  ClipboardList, Lock, Gauge,
} from "lucide-react";
import { format } from "date-fns";
import { cn, pctColor, pctTextClass } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ASSESSMENT_WEIGHTS } from "@/lib/constants";

// ── Types ──────────────────────────────────────────────────────────────
interface Overview {
  studentName: string;
  presentSessions: number;
  absentSessions: number;
  attendancePercentage: number;
  requiredPercentage: number;
  coursesInRecovery: number;
}
interface Subject {
  subjectTitle: string;
  attendancePercentage: number;
  presentSessions: number;
  totalSessions: number;
  isRecoveryMode: boolean;
}
interface RecentSession {
  date: string;
  sessionTitle: string;
  subjectTitle: string;
  attendanceStatus: string;
}

function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    if (!url) return;
    let active = true;
    setLoading(true);
    fetch(url)
      .then(async (r) => {
        if (r.status === 404) { if (active) setNotFound(true); return null; }
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => { if (active) setData(d); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url]);
  return { data, loading, notFound };
}

// ── Donut ──────────────────────────────────────────────────────────────
function DonutChart({ percentage }: { percentage: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  const color = pctColor(percentage);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={70} cy={70} r={r} stroke="#e5e7eb" strokeWidth={13} fill="none" />
        <circle cx={70} cy={70} r={r} stroke={color} strokeWidth={13} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>{percentage}%</span>
        <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">this semester</span>
      </div>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  const fill = pctColor(percentage);
  return (
    <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-visible">
      <div className="absolute left-0 top-0 h-2 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: fill }} />
      <div className="absolute top-[-3px] w-[2px] h-[calc(100%+6px)] bg-gray-400 rounded-full z-10"
        style={{ left: "80%" }} />
    </div>
  );
}

// ── Recovery banner ──────────────────────────────────────────────────────
function RecoveryBanner({ recoverySubjects }: { recoverySubjects: Subject[] }) {
  const consequences = [
    { icon: <BookOpen size={15} />, label: "SPI", sub: "Not earned this cycle" },
    { icon: <ClipboardList size={15} />, label: "Assessments", sub: "Can't sit them" },
    { icon: <Briefcase size={15} />, label: "Placements", sub: "Drives paused" },
    { icon: <Users size={15} />, label: "Internships", sub: "Nominations paused" },
    { icon: <Star size={15} />, label: "MINT · BRAVE · GRIT", sub: "On hold" },
  ];
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[15px] text-orange-900 leading-snug">You&apos;re in Recovery Mode</p>
            <p className="text-sm text-orange-700 mt-0.5 leading-relaxed">
              {recoverySubjects.length} course{recoverySubjects.length !== 1 ? "s" : ""} below 80% — you need to
              attend the assigned recovery classes to get them back above 80% and stay eligible for SPI.
            </p>
          </div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-600 mb-2">Courses in Recovery Mode</p>
        <div className="flex flex-wrap gap-2">
          {recoverySubjects.map((s) => (
            <span key={s.subjectTitle}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-800">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              {s.subjectTitle} · {s.attendancePercentage}%
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-orange-200 bg-orange-50/60 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">If Recovery Isn&apos;t Completed</p>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          Skip the recovery classes and a course moves into <span className="font-semibold text-gray-800">Skill Debt</span> — a
          single Skill Debt puts all of this on hold:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          {consequences.map((c) => (
            <div key={c.label} className="flex items-start gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2.5">
              <span className="text-orange-400 mt-0.5 shrink-0">{c.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{c.label}</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Stay clear: attend every assigned recovery class and restore attendance to 80% — then SPI,
          assessments and all activities stay open.
        </p>
      </div>
    </div>
  );
}

function StandingRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 size={18} className={ok ? "text-green-500 shrink-0" : "text-amber-400 shrink-0"} strokeWidth={2.5} />
      <div>
        <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
        <p className={cn("text-sm font-semibold", ok ? "text-green-600" : "text-amber-600")}>{value}</p>
      </div>
    </div>
  );
}

// ── Course cards + session modal ──────────────────────────────────────────
function SessionRow({ session }: { session: RecentSession }) {
  const isPresent = session.attendanceStatus.toUpperCase() === "PRESENT";
  let parsedDate: Date | null = null;
  try { parsedDate = new Date(session.date); } catch { /* ignore */ }
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 sm:px-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex flex-col items-center justify-center w-9 shrink-0 text-center">
        <span className="text-base font-bold text-gray-800 leading-none">{parsedDate ? format(parsedDate, "d") : "--"}</span>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mt-0.5">{parsedDate ? format(parsedDate, "MMM") : ""}</span>
      </div>
      <div className="w-px h-7 bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 leading-snug">{session.sessionTitle || "Session"}</p></div>
      <div className="shrink-0">
        {isPresent
          ? <span className="inline-block rounded-full bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-0.5">Present</span>
          : <span className="inline-block rounded-full bg-red-100 text-red-600 text-[11px] font-semibold px-2.5 py-0.5">Absent</span>}
      </div>
    </div>
  );
}

function CourseCard({ subject, onSelect }: { subject: Subject; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full text-left border border-gray-200 rounded-xl bg-white p-4 hover:border-gray-300 hover:shadow-md active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-900 leading-snug flex-1 min-w-0">{subject.subjectTitle}</span>
        <span className={cn("text-xl font-bold shrink-0 leading-none", pctTextClass(subject.attendancePercentage))}>{subject.attendancePercentage}%</span>
      </div>
      <ProgressBar percentage={subject.attendancePercentage} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">{subject.presentSessions} / {subject.totalSessions} sessions</span>
        {subject.isRecoveryMode
          ? <span className="text-[11px] font-semibold text-amber-600">Recovery</span>
          : <span className="text-[11px] font-semibold text-green-600">Meets 80%</span>}
      </div>
      <p className="text-[11px] text-gray-400 mt-2.5 text-right">Tap to view sessions →</p>
    </button>
  );
}

function SessionModal({ subject, sessions, loading, onClose }: { subject: Subject; sessions: RecentSession[]; loading?: boolean; onClose: () => void }) {
  const presentCount = sessions.filter((s) => s.attendanceStatus.toUpperCase() === "PRESENT").length;
  const absentCount = sessions.length - presentCount;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-snug">{subject.subjectTitle}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={cn("text-2xl font-bold", pctTextClass(subject.attendancePercentage))}>{subject.attendancePercentage}%</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {loading ? (
                    <span className="text-gray-400">{subject.presentSessions} / {subject.totalSessions} sessions</span>
                  ) : (
                    <>
                      <span className="text-green-600 font-medium">{presentCount} present</span><span>·</span>
                      <span className="text-red-500 font-medium">{absentCount} absent</span><span>·</span>
                      <span>{sessions.length} total</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No session data available.</p>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-2.5 sticky top-0 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Session</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</span>
              </div>
              <div className="px-2 py-1 space-y-0.5">{sessions.map((s, i) => <SessionRow key={i} session={s} />)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SPI / assessment "coming soon" ─────────────────────────────────────────
function ComingSoonSPI() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge size={18} className="text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">Your Skill Performance Index (SPI)</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold px-2.5 py-0.5">
          <Lock size={11} /> Coming soon
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ASSESSMENT_WEIGHTS.map((a) => (
          <div key={a.key} className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center">
            <p className="text-[11px] font-semibold text-gray-500 leading-tight">{a.label}</p>
            <p className="text-lg font-bold text-gray-300 mt-1">—</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{a.weight}% weight</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Classroom &amp; module quizzes, skill assessments and the final skill assessment will appear here and
        combine into your 0–10 SPI. Right now we&apos;re tracking <span className="font-semibold text-gray-700">attendance &amp; eligibility</span> only.
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
function StudentDashboard({ studentId }: { studentId: string }) {
  const ov = useApi<Overview>(`/api/attendance/students/${studentId}/overview`);
  const su = useApi<Subject[]>(`/api/attendance/students/${studentId}/subjects`);

  const overview = ov.data;
  const subjects = su.data ?? [];
  const loading = ov.loading || su.loading;

  const [selected, setSelected] = useState<Subject | null>(null);
  const [recent, setRecent] = useState<RecentSession[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);

  // Per-session detail is only needed inside the course modal — load it lazily
  // on first open so the page itself paints instantly.
  useEffect(() => {
    if (!selected || recent !== null) return;
    setRecentLoading(true);
    fetch(`/api/attendance/students/${studentId}/recent`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRecent(d ?? []))
      .finally(() => setRecentLoading(false));
  }, [selected, recent, studentId]);

  const selectedSessions = useMemo(
    () => (selected && recent ? recent.filter((r) => r.subjectTitle === selected.subjectTitle) : []),
    [selected, recent],
  );
  const recoverySubjects = useMemo(() => subjects.filter((s) => s.isRecoveryMode), [subjects]);

  if (loading) {
    return (
      <div className="space-y-5 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div>
        <Skeleton className="h-72 rounded-xl" /><Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (ov.notFound || !overview) return <NoStudentScreen />;

  const anyRecovery = recoverySubjects.length > 0;
  const delta = overview.attendancePercentage - overview.requiredPercentage;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Attendance &amp; Eligibility</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Your Attendance, {overview.studentName.trim()}</h1>
          <p className="text-sm text-gray-500 mt-1">Current semester · classes still in progress</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <RefreshCw size={12} /><span>Updated just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Current Semester Attendance</p>
          <div className="flex items-center gap-6">
            <DonutChart percentage={overview.attendancePercentage} />
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                {anyRecovery
                  ? `${recoverySubjects.length} course${recoverySubjects.length !== 1 ? "s" : ""} below 80% — complete recovery to earn your SPI.`
                  : delta >= 0
                    ? `You're ${Math.abs(delta).toFixed(1)} points above the ${overview.requiredPercentage}% minimum — on track to earn your SPI.`
                    : `You're ${Math.abs(delta).toFixed(1)} points below the ${overview.requiredPercentage}% minimum — complete recovery to earn your SPI.`}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-xl font-bold text-gray-900">{overview.presentSessions}</p><p className="text-xs text-gray-400 mt-0.5">Present</p></div>
                <div><p className="text-xl font-bold text-red-500">{overview.absentSessions}</p><p className="text-xs text-gray-400 mt-0.5">Absent</p></div>
                <div><p className="text-xl font-bold text-gray-900">{overview.requiredPercentage}%</p><p className="text-xs text-gray-400 mt-0.5">Required</p></div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-5">Your Standing</p>
          <div className="space-y-5">
            <StandingRow ok={!anyRecovery} label="Recovery Mode" value={anyRecovery ? "Active" : "Not active"} />
            <StandingRow ok={!anyRecovery} label="SPI Eligibility" value={anyRecovery ? "Not on track" : "On track"} />
            <StandingRow ok={recoverySubjects.length === 0} label="Courses in Recovery" value={recoverySubjects.length === 0 ? "None" : String(recoverySubjects.length)} />
          </div>
        </div>
      </div>

      {anyRecovery && <RecoveryBanner recoverySubjects={recoverySubjects} />}

      <ComingSoonSPI />

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Course-wise Attendance</h2>
          <span className="text-xs text-gray-400"><span className="text-gray-400">|</span> marks the <span className="font-semibold text-gray-600">80%</span> minimum</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((s) => <CourseCard key={s.subjectTitle} subject={s} onSelect={() => setSelected(s)} />)}
        </div>
      </div>

      {selected && <SessionModal subject={selected} sessions={selectedSessions} loading={recentLoading} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NoStudentScreen() {
  return (
    <div className="min-h-[100dvh] bg-[#f5f6fa] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-5"><AlertTriangle size={28} className="text-gray-400" /></div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No Student Data Found</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">We couldn&apos;t identify a student from this link. Please contact your admin to get the correct attendance link.</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 shadow-sm"><span>Please contact admin</span></div>
      </div>
    </div>
  );
}

export default function SpiPage({ params }: { params: { studentId: string } }) {
  const studentId = params.studentId?.trim() || "";
  if (!studentId) return <NoStudentScreen />;
  return <div className="min-h-[100dvh] bg-[#f5f6fa]"><StudentDashboard studentId={studentId} /></div>;
}
