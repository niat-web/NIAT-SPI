import { PageHeader } from "@/components/dashboard/PageHeader";
import CampusesClient from "@/components/dashboard/CampusesClient";

export const dynamic = "force-dynamic";

export default function CampusesPage() {
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <PageHeader title="Campuses" subtitle="Attendance rollups per campus and section, scoped to your role." />
      <CampusesClient />
    </div>
  );
}
