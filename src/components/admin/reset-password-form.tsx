"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordStrength } from "@/lib/password-policy";

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to reset password.");
      setMessage(body.message || "Password reset successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  return <form onSubmit={submit} className="mt-7 space-y-5">{message ? <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}<label className="block text-sm font-bold">New Password<div className="relative"><input required type={show ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={input} autoComplete="new-password" /><button type="button" onClick={() => setShow((value) => !value)} className="absolute right-3 top-[18px] rounded-lg p-2 text-slate-400">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{newPassword ? <div><div className="flex justify-between text-xs font-bold"><span>Password strength</span><span>{strength.label}</span></div><div className="mt-2 grid grid-cols-5 gap-1">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-1.5 rounded ${index < strength.score ? strength.score === 5 ? "bg-emerald-500" : "bg-amber-500" : "bg-slate-200"}`} />)}</div></div> : null}<label className="block text-sm font-bold">Confirm Password<input required type={show ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={input} autoComplete="new-password" /></label><button disabled={busy || !token} className="h-12 w-full rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-50">{busy ? "Resetting…" : "Reset Password"}</button></form>;
}
