"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Laptop, LogOut, ShieldCheck, Smartphone, XCircle } from "lucide-react";

type SessionRow = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  rememberMe: boolean;
  expiresAt: string;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
};

type LoginRow = {
  id: string;
  success: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
};

function deviceInfo(userAgent: string | null) {
  const ua = userAgent || "";
  const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /Chrome\//.test(ua) ? "Google Chrome" : /Firefox\//.test(ua) ? "Mozilla Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const device = mobile ? "Mobile device" : /Windows/i.test(ua) ? "Windows computer" : /Macintosh|Mac OS/i.test(ua) ? "Mac computer" : /Linux/i.test(ua) ? "Linux computer" : "Desktop device";
  return { browser, device, mobile };
}

export function SessionManager() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [history, setHistory] = useState<LoginRow[]>([]);
  const [legacy, setLegacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sessions", { cache: "no-store" });
      const body = await response.json() as { sessions?: SessionRow[]; history?: LoginRow[]; legacy?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load sessions.");
      setSessions(body.sessions || []);
      setHistory(body.history || []);
      setLegacy(body.legacy === true);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function logoutOthers() {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/admin/sessions", { method: "DELETE" });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to sign out other devices.");
      setMessage(body.message || "Other devices signed out.");
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to sign out other devices.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}
      {legacy ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Session history becomes available after the additive admin migration. Your current secure environment-backed login remains active.</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div><h3 className="font-extrabold">Active sessions</h3><p className="mt-1 text-sm text-slate-500">Devices currently signed in to this account.</p></div>
          <button type="button" disabled={busy || legacy || sessions.filter((session) => !session.isCurrent).length === 0} onClick={() => void logoutOthers()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"><LogOut size={16} />Logout Other Devices</button>
        </div>
        <div className="divide-y divide-slate-100 px-5 sm:px-6">
          {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading active sessions…</div> : sessions.length ? sessions.map((session) => {
            const info = deviceInfo(session.userAgent);
            const Icon = info.mobile ? Smartphone : Laptop;
            return (
              <div key={session.id} className="flex items-start gap-4 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0B4F7A]"><Icon size={20} /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{info.browser}</p>{session.isCurrent ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">Current session</span> : null}</div><p className="mt-1 text-sm text-slate-500">{info.device}{session.ipAddress && session.ipAddress !== "unknown" ? ` · ${session.ipAddress}` : ""}</p><p className="mt-1 text-xs text-slate-400">Signed in {new Date(session.createdAt).toLocaleString("en-IN")} · expires {new Date(session.expiresAt).toLocaleString("en-IN")}</p></div>
              </div>
            );
          }) : <div className="py-10 text-center text-sm text-slate-500">{legacy ? "Database-backed session details are not active yet." : "No active sessions found."}</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6"><h3 className="font-extrabold">Login history</h3><p className="mt-1 text-sm text-slate-500">Recent successful and unsuccessful sign-in attempts.</p></div>
        <div className="divide-y divide-slate-100 px-5 sm:px-6">
          {history.length ? history.map((item) => {
            const info = deviceInfo(item.userAgent);
            return (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{item.success ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.success ? "Successful login" : "Failed login attempt"}</p><p className="mt-1 truncate text-xs text-slate-500">{info.browser} · {info.device}</p></div>
                <time className="hidden text-xs text-slate-400 sm:block">{new Date(item.createdAt).toLocaleString("en-IN")}</time>
              </div>
            );
          }) : <div className="py-10 text-center text-sm text-slate-500">No login history available yet.</div>}
        </div>
      </section>

      <section className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={20} /></span>
        <div className="flex-1"><h3 className="font-extrabold">Two-factor authentication</h3><p className="mt-1 text-sm leading-6 text-slate-500">Architecture is ready for a future second authentication factor. No second factor is currently configured.</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Coming soon</span>
      </section>
    </div>
  );
}
