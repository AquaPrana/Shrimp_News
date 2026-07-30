"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          rememberMe: data.get("rememberMe") === "on",
        }),
        credentials: "same-origin",
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(body.error || "Unable to sign in. Check your credentials and try again.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = "h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div> : null}
      <label className="block text-sm font-bold text-slate-700">Email address<div className="relative mt-2"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="email" type="email" autoComplete="username" required className={input} placeholder="admin@shrimp.news" /></div></label>
      <label className="block text-sm font-bold text-slate-700">Password<div className="relative mt-2"><LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className={`${input} pr-12`} /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 font-semibold text-slate-600"><input name="rememberMe" type="checkbox" className="h-4 w-4 rounded border-slate-300" />Remember me</label>
        <Link href="/admin/forgot-password" className="font-bold text-[#0B4F7A] hover:underline">Forgot password?</Link>
      </div>
      <button disabled={busy} className="h-12 w-full rounded-xl bg-[#0B4F7A] font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#083e61] disabled:cursor-wait disabled:opacity-60">{busy ? "Signing in securely…" : "Sign In"}</button>
    </form>
  );
}
