import { ProfileForm } from "@/components/admin/profile-form";
import { SessionManager } from "@/components/admin/session-manager";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const admin = await requireAdmin();
  return <div className="space-y-8"><header><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Account</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Account Settings</h2><p className="mt-2 text-slate-600">Manage your profile, security controls, login history, and active devices.</p></header><section><h3 className="mb-4 text-lg font-extrabold">General</h3><ProfileForm admin={admin} showDetails={false} /></section><section><h3 className="mb-4 text-lg font-extrabold">Security</h3><SessionManager /></section></div>;
}
