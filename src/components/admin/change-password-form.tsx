"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { passwordStrength } from "@/lib/password-policy";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
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
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to change password.");
      setMessage(body.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const checks = [
    ["At least 8 characters", strength.checks.length],
    ["Uppercase letter", strength.checks.uppercase],
    ["Lowercase letter", strength.checks.lowercase],
    ["Number", strength.checks.number],
    ["Special character", strength.checks.special],
  ] as const;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><ShieldCheck size={22} /></span><div><h2 className="text-xl font-extrabold">Change your password</h2><p className="mt-1 text-sm leading-6 text-slate-500">A strong password protects every CMS publishing action.</p></div></div>
      {message ? <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}
      <PasswordField label="Current Password" value={currentPassword} setValue={setCurrentPassword} show={show} inputClass={input} autoComplete="current-password" />
      <PasswordField label="New Password" value={newPassword} setValue={setNewPassword} show={show} inputClass={input} autoComplete="new-password" />
      {newPassword ? (
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-xs font-bold"><span>Password strength</span><span className={strength.score >= 5 ? "text-emerald-700" : strength.score >= 3 ? "text-amber-700" : "text-red-600"}>{strength.label}</span></div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-1.5 rounded-full ${index < strength.score ? strength.score >= 5 ? "bg-emerald-500" : strength.score >= 3 ? "bg-amber-500" : "bg-red-500" : "bg-slate-200"}`} />)}</div>
          <ul className="mt-4 grid gap-2 text-xs sm:grid-cols-2">{checks.map(([label, valid]) => <li key={label} className={`flex items-center gap-2 ${valid ? "text-emerald-700" : "text-slate-500"}`}><Check size={13} />{label}</li>)}</ul>
        </div>
      ) : null}
      <PasswordField label="Confirm New Password" value={confirmPassword} setValue={setConfirmPassword} show={show} inputClass={input} autoComplete="new-password" />
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} />{show ? <EyeOff size={15} /> : <Eye size={15} />}Show passwords</label>
      <button type="submit" disabled={busy} className="h-11 rounded-xl bg-[#0B4F7A] px-6 text-sm font-bold text-white shadow-sm hover:bg-[#083e61] disabled:opacity-50">{busy ? "Changing Password…" : "Change Password"}</button>
    </form>
  );
}

function PasswordField({ label, value, setValue, show, inputClass, autoComplete }: { label: string; value: string; setValue: (value: string) => void; show: boolean; inputClass: string; autoComplete: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<input required type={show ? "text" : "password"} value={value} onChange={(event) => setValue(event.target.value)} className={inputClass} autoComplete={autoComplete} /></label>;
}
