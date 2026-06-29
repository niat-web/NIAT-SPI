import { bqQuery, TABLE, REQUIRED_PCT, sanitizeLike, escapeStr, pct } from "./bigquery";

export interface Scope {
  // Empty / undefined campuses => all campuses. Empty subjects => all subjects.
  campuses?: string[];
  subjects?: string[];
}

function scopeClause(scope?: Scope): string {
  const parts = ["is_current_semester = 1"];
  if (scope?.campuses && scope.campuses.length) {
    const list = scope.campuses.map((c) => `'${escapeStr(c)}'`).join(", ");
    parts.push(`institute_name IN (${list})`);
  }
  if (scope?.subjects && scope.subjects.length) {
    const list = scope.subjects.map((s) => `'${escapeStr(s)}'`).join(", ");
    parts.push(`subject_title IN (${list})`);
  }
  return parts.join(" AND ");
}

// ── Student-facing (SPI page) ─────────────────────────────────────────
export async function getStudentOverview(studentId: string) {
  const sql = `
    SELECT student_user_id, student_name, batch_section_name, institute_id, institute_name,
      derived_semester_title,
      CAST(MIN(semester_start_date) AS STRING) AS semester_start_date,
      CAST(MAX(semester_end_date) AS STRING) AS semester_end_date,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions,
      COUNTIF(attendance_status = 'ABSENT') AS absent_sessions
    FROM ${TABLE}
    WHERE student_user_id = '${escapeStr(studentId)}' AND is_current_semester = 1
    GROUP BY student_user_id, student_name, batch_section_name, institute_id, institute_name, derived_semester_title
    LIMIT 1`;
  const rows = await bqQuery(sql);
  if (!rows.length) return null;
  const r = rows[0];
  const total = Number(r.total_sessions ?? 0);
  const present = Number(r.present_sessions ?? 0);
  const absent = Number(r.absent_sessions ?? 0);

  const subjects = await getStudentSubjects(studentId);
  const coursesInRecovery = (subjects ?? []).filter((s) => s.isRecoveryMode).length;

  return {
    studentUserId: r.student_user_id ?? "",
    studentName: r.student_name ?? "",
    batchSectionName: r.batch_section_name ?? "",
    instituteId: r.institute_id ?? "",
    instituteName: r.institute_name ?? "",
    semesterTitle: r.derived_semester_title ?? "",
    semesterStartDate: r.semester_start_date ?? "",
    semesterEndDate: r.semester_end_date ?? "",
    totalSessions: total,
    presentSessions: present,
    absentSessions: absent,
    attendancePercentage: pct(present, total),
    requiredPercentage: REQUIRED_PCT,
    isRecoveryMode: pct(present, total) < REQUIRED_PCT,
    coursesInRecovery,
  };
}

export async function getStudentSubjects(studentId: string) {
  const sql = `
    SELECT subject_title,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions,
      COUNTIF(attendance_status = 'ABSENT') AS absent_sessions
    FROM ${TABLE}
    WHERE student_user_id = '${escapeStr(studentId)}' AND is_current_semester = 1
    GROUP BY subject_title ORDER BY total_sessions DESC`;
  const rows = await bqQuery(sql);
  if (!rows.length) return null;
  return rows.map((r) => {
    const total = Number(r.total_sessions ?? 0);
    const present = Number(r.present_sessions ?? 0);
    const absent = Number(r.absent_sessions ?? 0);
    const p = pct(present, total);
    return {
      subjectTitle: r.subject_title ?? "",
      totalSessions: total,
      presentSessions: present,
      absentSessions: absent,
      attendancePercentage: p,
      isRecoveryMode: p < REQUIRED_PCT,
      meetsRequirement: p >= REQUIRED_PCT,
    };
  });
}

export async function getStudentRecentSessions(studentId: string) {
  const sql = `
    SELECT CAST(date AS STRING) AS date, session_title, subject_title, attendance_status, marking_method
    FROM ${TABLE}
    WHERE student_user_id = '${escapeStr(studentId)}' AND is_current_semester = 1
    ORDER BY date DESC, session_section_id DESC`;
  const rows = await bqQuery(sql);
  if (!rows.length) return null;
  return rows.map((r) => ({
    date: r.date ?? "",
    sessionTitle: r.session_title ?? "",
    subjectTitle: r.subject_title ?? "",
    attendanceStatus: r.attendance_status ?? "",
    markingMethod: r.marking_method ?? "",
  }));
}

// ── Staff dashboards (scoped) ─────────────────────────────────────────
export async function searchStudents(q: string, limit: number, scope?: Scope) {
  let where = scopeClause(scope);
  const safe = q && q.trim() ? sanitizeLike(q.trim()) : "";
  if (safe) {
    where += ` AND (LOWER(student_name) LIKE LOWER('%${safe}%') OR student_user_id = '${escapeStr(q.trim())}')`;
  }
  const sql = `
    SELECT DISTINCT student_user_id, student_name, batch_section_name, institute_id, institute_name
    FROM ${TABLE} WHERE ${where}
    LIMIT ${Math.min(Number(limit) || 20, 50)}`;
  const rows = await bqQuery(sql);
  return rows.map((r) => ({
    studentUserId: r.student_user_id ?? "",
    studentName: r.student_name ?? "",
    batchSectionName: r.batch_section_name ?? "",
    instituteId: r.institute_id ?? "",
    instituteName: r.institute_name ?? "",
  }));
}

export async function getCampusSummary(scope?: Scope) {
  const sql = `
    SELECT institute_name,
      COUNT(DISTINCT student_user_id) AS students,
      COUNT(DISTINCT batch_section_name) AS sections,
      COUNT(DISTINCT subject_title) AS subjects,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions
    FROM ${TABLE} WHERE ${scopeClause(scope)}
    GROUP BY institute_name ORDER BY students DESC`;
  const rows = await bqQuery(sql);
  return rows.map((r) => {
    const total = Number(r.total_sessions ?? 0);
    const present = Number(r.present_sessions ?? 0);
    return {
      instituteName: r.institute_name ?? "",
      students: Number(r.students ?? 0),
      sections: Number(r.sections ?? 0),
      subjects: Number(r.subjects ?? 0),
      totalSessions: total,
      presentSessions: present,
      attendancePercentage: pct(present, total),
    };
  });
}

export async function getSubjectSummary(scope?: Scope) {
  const sql = `
    SELECT subject_title,
      COUNT(DISTINCT student_user_id) AS students,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions
    FROM ${TABLE} WHERE ${scopeClause(scope)}
    GROUP BY subject_title ORDER BY present_sessions / NULLIF(total_sessions,0) ASC`;
  const rows = await bqQuery(sql);
  return rows.map((r) => {
    const total = Number(r.total_sessions ?? 0);
    const present = Number(r.present_sessions ?? 0);
    return {
      subjectTitle: r.subject_title ?? "",
      students: Number(r.students ?? 0),
      totalSessions: total,
      presentSessions: present,
      attendancePercentage: pct(present, total),
    };
  });
}

export async function getSectionSummary(scope?: Scope) {
  const sql = `
    SELECT institute_name, batch_section_name,
      COUNT(DISTINCT student_user_id) AS students,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions
    FROM ${TABLE} WHERE ${scopeClause(scope)}
    GROUP BY institute_name, batch_section_name ORDER BY institute_name, batch_section_name`;
  const rows = await bqQuery(sql);
  return rows.map((r) => {
    const total = Number(r.total_sessions ?? 0);
    const present = Number(r.present_sessions ?? 0);
    return {
      instituteName: r.institute_name ?? "",
      batchSectionName: r.batch_section_name ?? "",
      students: Number(r.students ?? 0),
      totalSessions: total,
      presentSessions: present,
      attendancePercentage: pct(present, total),
    };
  });
}

export async function getStudentsList(scope: Scope | undefined, opts: { search?: string; limit?: number }) {
  let where = scopeClause(scope);
  const safe = opts.search && opts.search.trim() ? sanitizeLike(opts.search.trim()) : "";
  if (safe) {
    where += ` AND LOWER(student_name) LIKE LOWER('%${safe}%')`;
  }
  const sql = `
    SELECT student_user_id, ANY_VALUE(student_name) AS student_name,
      ANY_VALUE(institute_name) AS institute_name, ANY_VALUE(batch_section_name) AS batch_section_name,
      COUNT(*) AS total_sessions,
      COUNTIF(attendance_status = 'PRESENT') AS present_sessions
    FROM ${TABLE} WHERE ${where}
    GROUP BY student_user_id
    ORDER BY present_sessions / NULLIF(total_sessions,0) ASC
    LIMIT ${Math.min(Number(opts.limit) || 200, 1000)}`;
  const rows = await bqQuery(sql);
  return rows.map((r) => {
    const total = Number(r.total_sessions ?? 0);
    const present = Number(r.present_sessions ?? 0);
    return {
      studentUserId: r.student_user_id ?? "",
      studentName: r.student_name ?? "",
      instituteName: r.institute_name ?? "",
      batchSectionName: r.batch_section_name ?? "",
      totalSessions: total,
      presentSessions: present,
      attendancePercentage: pct(present, total),
    };
  });
}

export async function getCampusList(): Promise<string[]> {
  const sql = `SELECT DISTINCT institute_name FROM ${TABLE} WHERE is_current_semester = 1 ORDER BY institute_name`;
  const rows = await bqQuery(sql);
  return rows.map((r) => r.institute_name ?? "").filter(Boolean);
}
