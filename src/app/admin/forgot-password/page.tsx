import Image from "next/image";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export default function ForgotPasswordPage() {
  return <main className="admin-root flex min-h-screen items-center justify-center bg-[#07111f] px-4 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9"><span className="inline-flex rounded-xl bg-slate-50 p-2"><Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={160} height={54} className="h-auto w-36" priority /></span><span className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><KeyRound size={22} /></span><h1 className="mt-5 text-3xl font-extrabold tracking-tight">Forgot Password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your administrator email. For security, the response is the same whether or not an account exists.</p><ForgotPasswordForm /><Link href="/admin/login" className="mt-6 block text-center text-sm font-bold text-[#0B4F7A]">← Back to sign in</Link></div></main>;
}
