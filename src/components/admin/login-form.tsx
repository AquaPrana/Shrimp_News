"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
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
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Unable to sign in.");
        return;
      }
      router.replace("/admin/articles");
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <label className="block text-sm font-semibold text-slate-700">Email
        <input name="email" type="email" autoComplete="username" required className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
      </label>
      <button disabled={busy} className="h-12 w-full rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
