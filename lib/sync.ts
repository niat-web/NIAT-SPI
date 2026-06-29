import { bqQuery, TABLE, pct } from "./bigquery";
import { connectDB } from "./mongodb";
import { StudentSnapshot } from "../models/StudentSnapshot";
import { DashboardSummary } from "../models/DashboardSummary";
import { computeRollups } from "./queriesDb";

interface SessionRow { date: string; sessionTitle: string; subjectTitle: string; attendanceStatus: string; markingMethod: string }
interface Agg {
  studentName: string; instituteId: string; instituteName: string;
  batchSectionName: string; semesterTitle: string;
  subjects: { subjectTitle: string; total: number; present: number; absent: number }[];
  recentSessions: SessionRow[];
}

// Cap of per-session rows stored per student in the snapshot.
const MAX_SESSIONS_PER_STUDENT = 300;

// Pull current-semester attendance (per student × subject) from BigQuery and
// upsert one StudentSnapshot document per student. Idempotent.
export async function runSync(): Promise<{ students: number; durationMs: number }> {
  const started = Date.now();

  const sql = `
    SELECT student_user_id,
      ANY_VALUE(student_name) AS student_name,
      ANY_VALUE(institute_id) AS institute_id,
      ANY_VALUE(institute_name) AS institute_name,
      ANY_VALUE(batch_section_name) AS batch_section_name,
      ANY_VALUE(derived_semester_title) AS semester_title,
      subject_title,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions,
      COUNTIF(attendance_status = 'ABSENT') AS absent_sessions
    FROM ${TABLE}
    WHERE is_current_semester = 1
    GROUP BY student_user_id, subject_title`;

  const rows = await bqQuery(sql);

  const byStudent = new Map<string, Agg>();
  for (const r of rows) {
    const id = r.student_user_id ?? "";
    if (!id) continue;
    if (!byStudent.has(id)) {
      byStudent.set(id, {
        studentName: r.student_name ?? "",
        instituteId: r.institute_id ?? "",
        instituteName: r.institute_name ?? "",
        batchSectionName: r.batch_section_name ?? "",
        semesterTitle: r.semester_title ?? "",
        subjects: [],
        recentSessions: [],
      });
    }
    byStudent.get(id)!.subjects.push({
      subjectTitle: r.subject_title ?? "",
      total: Number(r.total_sessions ?? 0),
      present: Number(r.present_sessions ?? 0),
      absent: Number(r.absent_sessions ?? 0),
    });
  }

  // Per-session detail (BUG-2): pull the most recent sessions per student via a
  // window function so the snapshot can serve the course modal without a live
  // BigQuery hit. Capped per student to keep documents small (BUG-6).
  const sessionsSql = `
    SELECT student_user_id, CAST(date AS STRING) AS date, session_title, subject_title,
      attendance_status, marking_method
    FROM (
      SELECT *, ROW_NUMBER() OVER (
        PARTITION BY student_user_id ORDER BY date DESC, session_section_id DESC
      ) AS rn
      FROM ${TABLE}
      WHERE is_current_semester = 1
    )
    WHERE rn <= ${MAX_SESSIONS_PER_STUDENT}`;
  const sessionRows = await bqQuery(sessionsSql);
  for (const r of sessionRows) {
    const id = r.student_user_id ?? "";
    const agg = id ? byStudent.get(id) : undefined;
    if (!agg) continue;
    agg.recentSessions.push({
      date: r.date ?? "",
      sessionTitle: r.session_title ?? "",
      subjectTitle: r.subject_title ?? "",
      attendanceStatus: r.attendance_status ?? "",
      markingMethod: r.marking_method ?? "",
    });
  }

  await connectDB();
  const syncedAt = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [];
  for (const [studentUserId, a] of byStudent) {
    const total = a.subjects.reduce((s, x) => s + x.total, 0);
    const present = a.subjects.reduce((s, x) => s + x.present, 0);
    const absent = a.subjects.reduce((s, x) => s + x.absent, 0);
    ops.push({
      updateOne: {
        filter: { studentUserId },
        update: {
          $set: {
            studentUserId,
            studentName: a.studentName,
            instituteId: a.instituteId,
            instituteName: a.instituteName,
            batchSectionName: a.batchSectionName,
            semesterTitle: a.semesterTitle,
            totalSessions: total,
            presentSessions: present,
            absentSessions: absent,
            attendancePercentage: pct(present, total),
            subjects: a.subjects.map((x) => ({
              subjectTitle: x.subjectTitle,
              totalSessions: x.total,
              presentSessions: x.present,
              absentSessions: x.absent,
              attendancePercentage: pct(x.present, x.total),
            })),
            recentSessions: a.recentSessions,
            syncedAt,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length) {
    // Chunk to keep bulk writes reasonable.
    for (let i = 0; i < ops.length; i += 500) {
      await StudentSnapshot.bulkWrite(ops.slice(i, i + 500), { ordered: false });
    }
  }

  // IMP-1: pre-aggregate the global (all-campus) dashboard rollups from the same
  // in-memory data so the super-admin dashboard reads one tiny document.
  const snapForRollup = [...byStudent.entries()].map(([studentUserId, a]) => {
    const present = a.subjects.reduce((s, x) => s + x.present, 0);
    const total = a.subjects.reduce((s, x) => s + x.total, 0);
    return {
      studentUserId,
      studentName: a.studentName,
      instituteId: a.instituteId,
      instituteName: a.instituteName,
      batchSectionName: a.batchSectionName,
      semesterTitle: a.semesterTitle,
      totalSessions: total,
      presentSessions: present,
      absentSessions: a.subjects.reduce((s, x) => s + x.absent, 0),
      attendancePercentage: pct(present, total),
      subjects: a.subjects.map((x) => ({
        subjectTitle: x.subjectTitle,
        totalSessions: x.total,
        presentSessions: x.present,
        absentSessions: x.absent,
        attendancePercentage: pct(x.present, x.total),
      })),
    };
  });
  const rollups = computeRollups(snapForRollup as unknown as Parameters<typeof computeRollups>[0]);
  await DashboardSummary.updateOne(
    { key: "global" },
    { $set: { key: "global", ...rollups, syncedAt } },
    { upsert: true },
  );

  return { students: byStudent.size, durationMs: Date.now() - started };
}
