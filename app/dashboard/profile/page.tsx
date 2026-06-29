import { PageHeader } from "@/components/dashboard/PageHeader";
import ProfileForm from "@/components/dashboard/ProfileForm";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <PageHeader title="Edit Profile" subtitle="Update your name and password. Role, campuses and subjects are managed by an administrator." />
      <ProfileForm />
    </div>
  );
}
