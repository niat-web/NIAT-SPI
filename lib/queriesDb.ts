import { connectDB } from "./mongodb";
import { StudentSnapshot } from "../models/StudentSnapshot";
import { pct, REQUIRED_PCT } from "./bigquery";
import type { Scope } from "./queries";
import * as bq from "./queries";

// ── MongoDB-backed dashboard queries (fast: Atlas Mumbai, co-located) ──
// Each function falls back to the live BigQuery version if no snapshot exists
// yet (e.g. before the first nightly sync), so the app works either way.

interface SnapSubject { subjectTitle: string; totalSessions: number; presentSessions: number; absentSessions: number; attendancePercentage: number }
interface Snap {
  studentUserId: string; studentName: string; instituteId: string; instituteName: string;
  batchSectionName: string; semesterTitle: string;
  totalSessions: number; presentSessions: number; absentSessions: number; attendancePercentage: number;
  subjects: SnapSubject[];
  syncedAt?: string | Date;
}

let cachedHasData: { value: boolean; at: number } | null = null;

async function hasSnapshots(): Promise<boolean> {
  if (cachedHasData && Date.now() - cachedHasData.at < 60_000) return cachedHasData.value;
  await connectDB();
  const n = await StudentSnapshot.estimatedDocumentCount();
  cachedHasData = { value: n > 0, at: Date.now() };
  return n > 0;
}

async function loadScoped(scope?: Scope): Promise<Snap[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (scope?.campuses?.length) filter.instituteName = { $in: scope.campuses };
  const docs = await StudentSnapshot.find(filter)
    .select("studentUserId studentName instituteId instituteName batchSectionName semesterTitle totalSessions presentSessions absentSessions attendancePercentage subjects syncedAt")
    .lean();
  return docs as unknown as Snap[];
}

// Recompute a student's totals under an optional subject scope.
function totalsFor(doc: Snap, subjectScope?: string[]) {
  if (subjectScope?.length) {
    const subs = (doc.subjects ?? []).filter((s) => subjectScope.includes(s.subjectTitle));
    const present = subs.reduce((a, s) => a + (s.presentSessions ?? 0), 0);
    const total = subs.reduce((a, s) => a + (s.totalSessions ?? 0), 0);
    return { present, total, subjects: subs };
  }
  return { present: doc.presentSessions ?? 0, total: doc.totalSessions ?? 0, subjects: doc.subjects ?? [] };
}

// Load the scoped docs once and compute all three rollups together (used by the
// dashboard summary endpoint) — avoids three separate full collection scans.
export async function getDashboardSummary(scope?: Scope) {
  if (!(await hasSnapshots())) {
    const [campuses, subjects, sections] = await Promise.all([
      bq.getCampusSummary(scope), bq.getSubjectSummary(scope), bq.getSectionSummary(scope),
    ]);
    return { campuses, subjects, sections, syncedAt: null as string | null };
  }
  const docs = await loadScoped(scope);
  const syncedMs = docs.reduce((m, d) => {
    const t = d.syncedAt ? new Date(d.syncedAt).getTime() : 0;
    return t > m ? t : m;
  }, 0);
  return {
    campuses: computeCampus(docs, scope),
    subjects: computeSubjects(docs, scope),
    sections: computeSections(docs, scope),
    syncedAt: syncedMs ? new Date(syncedMs).toISOString() : null,
  };
}

function computeCampus(docs: Snap[], scope?: Scope) {
  const subjectScope = scope?.subjects;
  const map = new Map<string, { students: number; present: number; total: number; sections: Set<string>; subjects: Set<string> }>();
  for (const d of docs) {
    const t = totalsFor(d, subjectScope);
    if (!map.has(d.instituteName)) map.set(d.instituteName, { students: 0, present: 0, total: 0, sections: new Set(), subjects: new Set() });
    const m = map.get(d.instituteName)!;
    m.students += 1; m.present += t.present; m.total += t.total;
    m.sections.add(d.batchSectionName);
    for (const s of t.subjects) m.subjects.add(s.subjectTitle);
  }
  return [...map.entries()]
    .map(([instituteName, m]) => ({
      instituteName, students: m.students, sections: m.sections.size, subjects: m.subjects.size,
      totalSessions: m.total, presentSessions: m.present, attendancePercentage: pct(m.present, m.total),
    }))
    .sort((a, b) => b.students - a.students);
}

function computeSubjects(docs: Snap[], scope?: Scope) {
  const subjectScope = scope?.subjects;
  const map = new Map<string, { students: Set<string>; present: number; total: number }>();
  for (const d of docs) {
    for (const s of d.subjects ?? []) {
      if (subjectScope?.length && !subjectScope.includes(s.subjectTitle)) continue;
      if (!map.has(s.subjectTitle)) map.set(s.subjectTitle, { students: new Set(), present: 0, total: 0 });
      const m = map.get(s.subjectTitle)!;
      m.students.add(d.studentUserId); m.present += s.presentSessions ?? 0; m.total += s.totalSessions ?? 0;
    }
  }
  return [...map.entries()]
    .map(([subjectTitle, m]) => ({
      subjectTitle, students: m.students.size, totalSessions: m.total, presentSessions: m.present,
      attendancePercentage: pct(m.present, m.total),
    }))
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage);
}

function computeSections(docs: Snap[], scope?: Scope) {
  const subjectScope = scope?.subjects;
  const map = new Map<string, { instituteName: string; batchSectionName: string; students: number; present: number; total: number }>();
  for (const d of docs) {
    const t = totalsFor(d, subjectScope);
    const key = d.instituteName + "||" + d.batchSectionName;
    if (!map.has(key)) map.set(key, { instituteName: d.instituteName, batchSectionName: d.batchSectionName, students: 0, present: 0, total: 0 });
    const m = map.get(key)!;
    m.students += 1; m.present += t.present; m.total += t.total;
  }
  return [...map.values()]
    .map((m) => ({ instituteName: m.instituteName, batchSectionName: m.batchSectionName, students: m.students, totalSessions: m.total, presentSessions: m.present, attendancePercentage: pct(m.present, m.total) }))
    .sort((a, b) => a.instituteName.localeCompare(b.instituteName) || a.batchSectionName.localeCompare(b.batchSectionName));
}

export async function getStudentsList(scope: Scope | undefined, opts: { search?: string; limit?: number }) {
  if (!(await hasSnapshots())) return bq.getStudentsList(scope, opts);
  const docs = await loadScoped(scope);
  const subjectScope = scope?.subjects;
  const search = opts.search?.trim().toLowerCase();
  let out = docs
    .filter((d) => (search ? d.studentName.toLowerCase().includes(search) : true))
    .map((d) => {
      const t = totalsFor(d, subjectScope);
      return {
        studentUserId: d.studentUserId, studentName: d.studentName, instituteName: d.instituteName,
        batchSectionName: d.batchSectionName, totalSessions: t.total, presentSessions: t.present,
        attendancePercentage: pct(t.present, t.total),
      };
    })
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage);
  const limit = Math.min(Number(opts.limit) || 200, 2000);
  return out.slice(0, limit);
}

export async function searchStudents(q: string, limit: number, scope?: Scope) {
  if (!(await hasSnapshots())) return bq.searchStudents(q, limit, scope);
  const docs = await loadScoped(scope);
  const t = q.trim().toLowerCase();
  return docs
    .filter((d) => (t ? d.studentName.toLowerCase().includes(t) || d.studentUserId === q.trim() : true))
    .slice(0, Math.min(Number(limit) || 20, 50))
    .map((d) => ({
      studentUserId: d.studentUserId, studentName: d.studentName, batchSectionName: d.batchSectionName,
      instituteId: d.instituteId, instituteName: d.instituteName,
    }));
}

// ── Student SPI page (snapshot-first, BigQuery fallback) ──
export async function getStudentOverview(studentId: string) {
  await connectDB();
  const d = (await StudentSnapshot.findOne({ studentUserId: studentId }).lean()) as unknown as Snap | null;
  if (!d) return bq.getStudentOverview(studentId); // fallback to live
  const coursesInRecovery = (d.subjects ?? []).filter((s) => (s.attendancePercentage ?? 0) < REQUIRED_PCT).length;
  return {
    studentUserId: d.studentUserId, studentName: d.studentName, batchSectionName: d.batchSectionName,
    instituteId: d.instituteId, instituteName: d.instituteName, semesterTitle: d.semesterTitle,
    semesterStartDate: "", semesterEndDate: "",
    totalSessions: d.totalSessions ?? 0, presentSessions: d.presentSessions ?? 0, absentSessions: d.absentSessions ?? 0,
    attendancePercentage: d.attendancePercentage ?? 0, requiredPercentage: REQUIRED_PCT,
    isRecoveryMode: (d.attendancePercentage ?? 0) < REQUIRED_PCT, coursesInRecovery,
    syncedAt: d.syncedAt ? new Date(d.syncedAt).toISOString() : null,
  };
}

export async function getStudentSubjects(studentId: string) {
  await connectDB();
  const d = (await StudentSnapshot.findOne({ studentUserId: studentId }).lean()) as unknown as Snap | null;
  if (!d) return bq.getStudentSubjects(studentId);
  if (!d.subjects?.length) return [];
  return d.subjects.map((s) => ({
    subjectTitle: s.subjectTitle, totalSessions: s.totalSessions, presentSessions: s.presentSessions,
    absentSessions: s.absentSessions, attendancePercentage: s.attendancePercentage,
    isRecoveryMode: s.attendancePercentage < REQUIRED_PCT, meetsRequirement: s.attendancePercentage >= REQUIRED_PCT,
  }));
}
