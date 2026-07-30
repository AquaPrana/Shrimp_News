"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Camera, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { AdminSession } from "@/lib/admin-auth";

export function ProfileForm({ admin, showDetails = true }: { admin: AdminSession; showDetails?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [imageUrl, setImageUrl] = useState(admin.imageUrl || "");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function notify(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function upload(file: File) {
    setBusy("upload");
    notify("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/upload-image", { method: "POST", body: data });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Unable to upload profile photo.");
      setImageUrl(body.url);
      notify("Profile photo uploaded. Save changes to apply it.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to upload profile photo.", true);
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    notify("");
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, imageUrl }),
      });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Unable to update profile.");
      notify(body.message || "Profile updated.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update profile.", true);
    } finally {
      setBusy("");
    }
  }

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SN";
  const input = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      {showDetails ? (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-700 shadow-lg shadow-blue-900/15">
            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-black text-white">{initials}</span>}
          </div>
          <h2 className="mt-5 text-xl font-extrabold">{name}</h2>
          <p className="mt-1 text-sm text-slate-500">{email}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700"><ShieldCheck size={14} />Super Admin</span>
          <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-left text-sm">
            <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</dt><dd className="mt-1 font-semibold text-slate-700">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Migration pending"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last login</dt><dd className="mt-1 font-semibold text-slate-700">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("en-IN") : "Not recorded yet"}</dd></div>
          </dl>
        </aside>
      ) : null}

      <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div><h2 className="text-lg font-extrabold">Profile information</h2><p className="mt-1 text-sm text-slate-500">Update the identity shown throughout the administration workspace.</p></div>
        {message ? <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700"><span className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" />Name</span><input required value={name} onChange={(event) => setName(event.target.value)} className={input} /></label>
          <label className="text-sm font-bold text-slate-700"><span className="flex items-center gap-2"><Mail size={15} className="text-slate-400" />Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={input} /></label>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-200">
              {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-black text-slate-500">{initials}</span>}
            </div>
            <div className="flex-1"><p className="text-sm font-bold">Profile photo</p><p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB.</p></div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold shadow-sm"><Camera size={16} />{busy === "upload" ? "Uploading…" : "Upload"}<input ref={fileRef} type="file" disabled={Boolean(busy)} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>
            {imageUrl ? <button type="button" disabled={Boolean(busy)} onClick={() => setImageUrl("")} className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600">Remove</button> : null}
          </div>
        </section>
        <button type="submit" disabled={Boolean(busy)} className="h-11 rounded-xl bg-[#0B4F7A] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#083e61] disabled:opacity-50">{busy === "save" ? "Saving…" : "Save Changes"}</button>
      </form>
    </div>
  );
}
