import { PageHeader } from "@/components/dashboard/PageHeader";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Manage Users" subtitle="Create staff accounts, assign roles, campuses and subjects. They sign in once and stay logged in for 30 days." />
      <UsersManager />
    </div>
  );
}
