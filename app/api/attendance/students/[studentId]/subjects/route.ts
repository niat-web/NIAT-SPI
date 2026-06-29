import { NextResponse } from "next/server";
import { validateStudentId } from "@/lib/bigquery";
import { getStudentSubjects } from "@/lib/queriesDb";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { studentId: string } },
) {
  const studentId = params.studentId;
  if (!validateStudentId(studentId)) {
    return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 });
  }
  try {
    const data = await withCache(`subjects:${studentId}`, () => getStudentSubjects(studentId), 5 * 60 * 1000);
    if (!data) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
