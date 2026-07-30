import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-root grid min-h-screen bg-[#07111f] lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(59,130,246,0.18),transparent_42%)]" />
        <div className="relative">
          <span className="inline-flex rounded-2xl bg-white p-3 shadow-2xl"><Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={190} height={64} className="h-auto w-44" priority /></span>
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Editorial Control Centre</p>
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight xl:text-6xl">Professional publishing, from one secure workspace.</h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">Manage Shrimp.News stories, events, market updates, subscribers, and Weekly Brief operations.</p>
          <ul className="mt-8 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2">{["Secure sessions", "Role-ready access", "Editorial workflows", "Audience management"].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-300" />{item}</li>)}</ul>
        </div>
        <p className="relative text-xs text-slate-500">Shrimp.News CMS · Authorised administrators only</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="lg:hidden"><span className="inline-flex rounded-xl bg-slate-50 p-2"><Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={160} height={54} className="h-auto w-36" priority /></span></div>
          <span className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 lg:mt-0"><ShieldCheck size={22} /></span>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Secure Administration</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your authorised Super Admin account.</p>
          <LoginForm />
          <div className="mt-7 border-t border-slate-100 pt-5 text-center"><Link href="/" className="text-sm font-bold text-slate-500 transition hover:text-[#0B4F7A]">← Back to Shrimp.News</Link></div>
        </div>
      </section>
    </main>
  );
}
