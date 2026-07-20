/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-root min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={190} height={64} className="h-auto w-44" priority />
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.3em] text-cyan-600">Secure administration</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#0B3A6E]">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your authorised account to manage articles and subscribers.</p>
        <LoginForm />
        <a href="/" className="mt-6 block text-center text-sm font-semibold text-cyan-700">← Back to Shrimp.News</a>
      </div>
    </main>
  );
}
