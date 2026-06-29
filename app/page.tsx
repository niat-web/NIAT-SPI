import Link from "next/link";
import {
  Gauge, CalendarCheck, AlertTriangle, ClipboardList, BookOpen, Award,
  ShieldCheck, TrendingUp, Briefcase, Users, Star, ArrowRight,
} from "lucide-react";

const assessments = [
  { label: "Classroom Quizzes", weight: "10%", sub: "2 per topic — topic-level clarity" },
  { label: "Module Quizzes", weight: "15%", sub: "Every 3 topics — apply concepts" },
  { label: "Skill Assessments", weight: "25%", sub: "Every 15–30 days — speed & retention" },
  { label: "Final Skill Assessment", weight: "50%", sub: "End of course — full readiness" },
];

const levels = [
  { range: "90–100", grade: "A+", pts: "10" },
  { range: "80–89.99", grade: "A", pts: "9" },
  { range: "70–79.99", grade: "B", pts: "8" },
  { range: "60–69.99", grade: "C", pts: "7" },
  { range: "50–59.99", grade: "D", pts: "6" },
  { range: "Below 50", grade: "F", pts: "0" },
];

const features = [
  {
    icon: <CalendarCheck className="text-blue-600" size={22} />,
    title: "Attendance & Eligibility",
    body: "Live, semester-wide attendance per course. A minimum of 80% keeps you eligible to earn your SPI.",
  },
  {
    icon: <AlertTriangle className="text-amber-500" size={22} />,
    title: "Recovery Mode",
    body: "Drop below 80% in a course and it enters Recovery — attend the assigned recovery classes to restore it.",
  },
  {
    icon: <TrendingUp className="text-green-600" size={22} />,
    title: "Skill Performance Index",
    body: "A single 0–10 score per course and overall that reflects how you learn, perform and stay skill-ready.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-[100dvh] bg-[#f5f6fa] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Gauge size={17} /></div>
            <span className="font-bold">NIAT SPI</span>
          </div>
          <Link href="/staff-login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            <ShieldCheck size={15} /> Staff sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">NIAT · Skill Performance Index</p>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          A skill score that tracks how<br className="hidden sm:block" /> you learn and how skill-ready you are.
        </h1>
        <p className="text-gray-500 mt-5 max-w-2xl mx-auto leading-relaxed">
          The SPI gives a complete view of every learner&apos;s engagement, performance and readiness in each
          course — built from continuous learning, assessment participation and skill mastery.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-500 shadow-sm">
          <span>Your personal report opens at</span>
          <code className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700">/spi/&lt;your-id&gt;</code>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How you're assessed */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><ClipboardList size={18} className="text-blue-600" /><h2 className="text-xl font-bold">How you&apos;re assessed</h2></div>
          <p className="text-sm text-gray-500 mb-6">Four checkpoints build your course score — the Final Skill Assessment matters most.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {assessments.map((a) => (
              <div key={a.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                  <span className="text-lg font-bold text-blue-600">{a.weight}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">{a.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">SPI</span> = Sum of (Course Points × Weights) ÷ Total Weights — a single score from 0 to 10.
          </div>
        </div>
      </section>

      {/* Skill levels + eligibility */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><Award size={18} className="text-blue-600" /><h2 className="text-xl font-bold">Skill levels &amp; points</h2></div>
          <div className="space-y-2">
            {levels.map((l) => (
              <div key={l.grade} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5">
                <span className="text-sm text-gray-500">{l.range}</span>
                <span className="text-sm font-semibold text-gray-800">{l.grade}</span>
                <span className="text-sm font-bold text-blue-600">{l.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><BookOpen size={18} className="text-blue-600" /><h2 className="text-xl font-bold">Eligibility to earn SPI</h2></div>
          <ul className="space-y-3 text-sm">
            {[
              "Attendance — minimum 80% (Recovery Mode applies if missed)",
              "Classroom Quizzes — 100% participation",
              "Module Quizzes — 100% completion",
              "Skill Assessment — 100% participation",
              "Final Skill Assessment — mandatory participation",
              "Assessment honesty — no malpractice",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Skill debt consequences */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-orange-500" /><h2 className="text-xl font-bold text-orange-900">A single Skill Debt puts activities on hold</h2></div>
          <p className="text-sm text-orange-700 mb-5 max-w-3xl">Skip recovery and a course becomes a Skill Debt — until it&apos;s cleared, NIAT-specific activities pause.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { icon: <BookOpen size={15} />, label: "SPI" },
              { icon: <ClipboardList size={15} />, label: "Assessments" },
              { icon: <Briefcase size={15} />, label: "Placements" },
              { icon: <Users size={15} />, label: "Internships" },
              { icon: <Star size={15} />, label: "MINT · BRAVE · GRIT" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2.5">
                <span className="text-orange-400 shrink-0">{c.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© NIAT · Skill Performance Index</span>
          <Link href="/staff-login" className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            Staff console <ArrowRight size={14} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
