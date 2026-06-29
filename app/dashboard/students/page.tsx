import { PageHeader } from "@/components/dashboard/PageHeader";
import StudentsClient from "@/components/dashboard/StudentsClient";

export const dynamic = "force-dynamic";

export default function StudentsPage() {
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <PageHeader title="Students" subtitle="Live from BigQuery. Click a student to open their SPI report." />
      <StudentsClient />
    </div>
  );
}
