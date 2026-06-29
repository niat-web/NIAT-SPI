import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canManage } from "@/lib/rbac";
import Sidebar from "@/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/staff-login");

  return (
    <div className="min-h-[100dvh] bg-[#f5f6fa] md:flex">
      <Sidebar
        name={session.name}
        email={session.email}
        role={session.role}
        canManage={canManage(session.role)}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
