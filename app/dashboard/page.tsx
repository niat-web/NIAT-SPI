import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import OverviewClient from "@/components/dashboard/OverviewClient";

export const dynamic = "force-dynamic";

function scopeLabel(role: string, campuses: string[], subjects: string[]): string {
  if (role === "superadmin" || role === "admin" || role === "hod") return "All campuses";
  const parts: string[] = [];
  parts.push(campuses.length ? campuses.join(", ") : "No campus assigned");
  if ((role === "capability_manager" || role === "instructor") && subjects.length) {
    parts.push(subjects.join(", "));
  }
  return parts.join(" · ");
}

export default async function DashboardOverview() {
  const session = await getSession();
  if (!session) redirect("/staff-login");

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome, ${session.name.split(" ")[0]}`}
        subtitle="Live attendance & eligibility across your scope. Scores and SPI components arrive soon."
      />
      <OverviewClient
        role={session.role}
        scopeLabel={scopeLabel(session.role, session.campuses, session.subjects)}
      />
    </div>
  );
}
