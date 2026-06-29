import { PageHeader } from "@/components/dashboard/PageHeader";
import CampusesManager from "@/components/admin/CampusesManager";

export const dynamic = "force-dynamic";

export default function AdminCampusesPage() {
  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Manage Campuses" subtitle="Campus names must match the institute_name used in the attendance data so scoping works." />
      <CampusesManager />
    </div>
  );
}
