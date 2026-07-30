"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json() as { message?: string };
      setMessage(body.message || "If an administrator account matches that email, reset instructions will be sent.");
    } catch {
      setMessage("If an administrator account matches that email, reset instructions will be sent.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-7 space-y-5">{message ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{message}</div> : null}<label className="block text-sm font-bold text-slate-700">Administrator email<div className="relative mt-2"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></div></label><button disabled={busy} className="h-12 w-full rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-60">{busy ? "Sending securely…" : "Send Reset Instructions"}</button></form>;
}
