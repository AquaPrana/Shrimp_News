import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="admin-root flex min-h-screen items-center justify-center bg-[#07111f] px-4 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9"><span className="inline-flex rounded-xl bg-slate-50 p-2"><Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={160} height={54} className="h-auto w-36" priority /></span><span className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={22} /></span><h1 className="mt-5 text-3xl font-extrabold tracking-tight">Reset Password</h1><p className="mt-2 text-sm leading-6 text-slate-500">{token ? "Choose a new strong password for your administrator account." : "This reset link is incomplete. Request a new password reset link."}</p><ResetPasswordForm token={token} /><Link href="/admin/login" className="mt-6 block text-center text-sm font-bold text-[#0B4F7A]">Back to sign in</Link></div></main>;
}
