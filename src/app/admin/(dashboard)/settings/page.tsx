import Link from "next/link";
import { KeyRound, Settings, ShieldCheck, UserCircle } from "lucide-react";

const settings = [
  { href: "/admin/profile", title: "My Profile", detail: "Update your name, email, and profile photo.", icon: UserCircle },
  { href: "/admin/settings/account", title: "Account Settings", detail: "Review login history, devices, and security controls.", icon: Settings },
  { href: "/admin/settings/password", title: "Change Password", detail: "Set a strong password and revoke other sessions.", icon: KeyRound },
] as const;

export default function SettingsPage() {
  return <div className="space-y-6"><header><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Administration</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Settings</h2><p className="mt-2 text-slate-600">Manage your CMS identity, account, and security preferences.</p></header><div className="grid gap-4 lg:grid-cols-3">{settings.map(({ href, title, detail, icon: Icon }) => <Link key={href} href={href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-[#0B4F7A] group-hover:text-white"><Icon size={21} /></span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Link>)}</div><section className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={22} /></span><div><h3 className="font-extrabold">Role architecture</h3><p className="mt-1 text-sm leading-6 text-slate-500">The CMS supports Super Admin, Editor, and Viewer roles. The current provisioned account remains the only Super Admin.</p></div></section></div>;
}
