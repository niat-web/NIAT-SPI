import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campus } from "@/models/Campus";
import { getSession } from "@/lib/auth";
import { canManage, manageableRoles } from "@/lib/rbac";
import { SUBJECTS, CAMPUSES, ROLE_LABELS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const dbCampuses = await Campus.find({ isActive: true }).sort({ name: 1 }).lean();
  const campusNames = dbCampuses.length ? dbCampuses.map((c) => c.name) : [...CAMPUSES];

  return NextResponse.json({
    campuses: campusNames,
    subjects: [...SUBJECTS],
    roles: manageableRoles(session.role).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
  });
}
