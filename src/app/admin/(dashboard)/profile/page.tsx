import { ProfileForm } from "@/components/admin/profile-form";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const admin = await requireAdmin();
  return (
    <div className="space-y-6">
      <header><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Personal Workspace</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">My Profile</h2><p className="mt-2 text-slate-600">Manage your administrator identity and profile photo.</p></header>
      <ProfileForm admin={admin} />
    </div>
  );
}
