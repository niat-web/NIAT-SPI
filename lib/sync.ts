import { bqQuery, TABLE, pct } from "./bigquery";
import { connectDB } from "./mongodb";
import { StudentSnapshot } from "../models/StudentSnapshot";

interface Agg {
  studentName: string; instituteId: string; instituteName: string;
  batchSectionName: string; semesterTitle: string;
  subjects: { subjectTitle: string; total: number; present: number; absent: number }[];
}

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
      });
    }
    byStudent.get(id)!.subjects.push({
      subjectTitle: r.subject_title ?? "",
      total: Number(r.total_sessions ?? 0),
      present: Number(r.present_sessions ?? 0),
      absent: Number(r.absent_sessions ?? 0),
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

  return { students: byStudent.size, durationMs: Date.now() - started };
}
