import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default function ChangePasswordPage() {
  return <div className="space-y-6"><header><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Security</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Change Password</h2><p className="mt-2 text-slate-600">Update your password and revoke access from other devices.</p></header><ChangePasswordForm /></div>;
}
