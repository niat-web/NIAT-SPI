import { NextResponse } from "next/server";
import { validateStudentId } from "@/lib/bigquery";
import { getStudentOverview } from "@/lib/queriesDb";
import { withCache } from "@/lib/cache";
import { allowSpiAccess, jsonError, safe } from "@/lib/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { studentId: string } },
) {
  const studentId = params.studentId;
  if (!validateStudentId(studentId)) return jsonError("Invalid student ID format", 400);

  const denied = await allowSpiAccess(req, studentId);
  if (denied) return denied;

  return safe(async () => {
    const data = await withCache(`overview:${studentId}`, () => getStudentOverview(studentId), 5 * 60 * 1000);
    if (!data) return jsonError("Student not found", 404);
    return NextResponse.json(data);
  });
}
