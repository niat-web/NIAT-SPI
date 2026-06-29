import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import BigQueryExplorer from "@/components/dashboard/BigQueryExplorer";

export const dynamic = "force-dynamic";

export default async function BigQueryPage() {
  const session = await getSession();
  if (!session) redirect("/staff-login");
  if (session.role !== "superadmin") redirect("/dashboard"); // super admin only

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="BigQuery Check" subtitle="Browse datasets and tables on the connected service account, and preview live rows." />
      <BigQueryExplorer />
    </div>
  );
}
