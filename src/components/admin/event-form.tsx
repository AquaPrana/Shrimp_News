"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminEvent, EventRegion, EventStatus } from "@/lib/event-types";
import { slugify } from "@/lib/validation";

type FormState = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  startDate: string;
  endDate: string;
  dateLabel: string;
  venue: string;
  duration: string;
  category: string;
  region: EventRegion;
  audience: string;
  imageUrl: string;
  officialWebsite: string;
  isFeatured: boolean;
  displayOrder: string;
  status: EventStatus;
};

const empty: FormState = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  startDate: "",
  endDate: "",
  dateLabel: "",
  venue: "",
  duration: "",
  category: "",
  region: "India",
  audience: "",
  imageUrl: "",
  officialWebsite: "",
  isFeatured: false,
  displayOrder: "0",
  status: "draft",
};

function dateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function fromEvent(event?: AdminEvent): FormState {
  if (!event) return empty;
  return {
    title: event.title,
    slug: event.slug,
    shortDescription: event.shortDescription || "",
    description: event.description || "",
    startDate: dateInput(event.startDate),
    endDate: dateInput(event.endDate),
    dateLabel: event.dateLabel || "",
    venue: event.venue,
    duration: event.duration || "",
    category: event.category,
    region: event.region,
    audience: event.audience || "",
    imageUrl: event.imageUrl || "",
    officialWebsite: event.officialWebsite || "",
    isFeatured: event.isFeatured,
    displayOrder: String(event.displayOrder),
    status: event.status,
  };
}

export function EventForm({ event }: { event?: AdminEvent }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(() => fromEvent(event));
  const [manualSlug, setManualSlug] = useState(
    () => Boolean(event && event.slug !== slugify(event.title)),
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [preview, setPreview] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: manualSlug ? current.slug : slugify(title),
    }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage("");
    setIsError(false);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/upload-image", { method: "POST", body: data });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || "Image upload failed.");
      setField("imageUrl", body.url);
      setMessage("Image uploaded successfully.");
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(
        event ? `/api/admin/events/${event.id}` : "/api/admin/events",
        {
          method: event ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...form,
            displayOrder: Number(form.displayOrder || 0),
            startDate: form.startDate
              ? new Date(`${form.startDate}T00:00:00.000Z`).toISOString()
              : "",
            endDate: form.endDate
              ? new Date(`${form.endDate}T00:00:00.000Z`).toISOString()
              : "",
          }),
        },
      );
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save event.");
      setMessage(body.message || "Event saved.");
      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to save event.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const textarea = `${input} h-auto min-h-28 py-3`;
  const shownImage = localPreview || form.imageUrl;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Events</p>
          <h1 className="mt-2 text-3xl font-extrabold">{event ? "Edit Event" : "Add Event"}</h1>
          <p className="mt-2 text-slate-600">Manage event content without changing the public layout.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className="h-11 rounded-xl border bg-white px-4 text-sm font-bold"
          >
            {preview ? "Hide Preview" : "Preview"}
          </button>
          <Link href="/admin/events" className="inline-flex h-11 items-center rounded-xl border bg-white px-4 text-sm font-bold">
            Cancel
          </Link>
        </div>
      </header>

      {message ? (
        <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      ) : null}

      {preview ? (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm md:grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="aspect-[3/2] bg-slate-100">
            {shownImage ? <img src={shownImage} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">{form.region}</span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#0B3A6E]">{form.title || "Event title"}</h2>
            <p className="mt-3 text-sm font-semibold text-slate-600">{form.dateLabel || form.startDate || "Event date"}</p>
            <p className="mt-2 text-sm text-slate-600">{form.venue || "Venue"}</p>
            <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">{form.shortDescription || form.description || "Event description"}</p>
          </div>
        </section>
      ) : null}

      <form onSubmit={submit} className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Event title *
            <input required value={form.title} onChange={(e) => updateTitle(e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Slug *
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setManualSlug(true);
                setField("slug", slugify(e.target.value));
              }}
              className={input}
            />
          </label>
          <label className="text-sm font-semibold">
            Start date *
            <input required type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            End date
            <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Display date label
            <input value={form.dateLabel} onChange={(e) => setField("dateLabel", e.target.value)} className={input} placeholder="1–3 September 2026" />
          </label>
          <label className="text-sm font-semibold">
            Venue *
            <input required value={form.venue} onChange={(e) => setField("venue", e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Duration
            <input value={form.duration} onChange={(e) => setField("duration", e.target.value)} className={input} placeholder="3 Days" />
          </label>
          <label className="text-sm font-semibold">
            Category *
            <input required value={form.category} onChange={(e) => setField("category", e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Region *
            <select value={form.region} onChange={(e) => setField("region", e.target.value as EventRegion)} className={input}>
              <option value="India">India</option>
              <option value="International">International</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Official website
            <input type="url" value={form.officialWebsite} onChange={(e) => setField("officialWebsite", e.target.value)} className={input} placeholder="https://…" />
          </label>
          <label className="text-sm font-semibold">
            Display order
            <input type="number" value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select value={form.status} onChange={(e) => setField("status", e.target.value as EventStatus)} className={input}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Short description
          <textarea value={form.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} className={textarea} />
        </label>
        <label className="block text-sm font-semibold">
          Full description
          <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} className={`${textarea} min-h-52`} />
        </label>
        <label className="block text-sm font-semibold">
          Audience (one item per line)
          <textarea value={form.audience} onChange={(e) => setField("audience", e.target.value)} className={textarea} />
        </label>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold">Event image</p>
          {shownImage ? <img src={shownImage} alt="Event preview" className="h-40 w-full rounded-xl object-cover sm:w-64" /> : null}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border bg-white px-4 text-sm font-bold">
              {uploading ? "Uploading…" : form.imageUrl ? "Replace image" : "Upload image"}
              <input
                ref={fileInputRef}
                disabled={uploading}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
            </label>
            {shownImage ? (
              <button
                type="button"
                onClick={() => {
                  setField("imageUrl", "");
                  if (localPreview) URL.revokeObjectURL(localPreview);
                  setLocalPreview(null);
                }}
                className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600"
              >
                Remove image
              </button>
            ) : null}
          </div>
          <label className="block text-sm font-semibold">
            Or image URL
            <input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} className={input} placeholder="/images/… or https://…" />
          </label>
        </section>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField("isFeatured", e.target.checked)} />
          Featured event
        </label>

        <button type="submit" disabled={busy || uploading} className="h-11 rounded-xl bg-[#0B4F7A] px-6 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Saving…" : event ? "Update Event" : "Add Event"}
        </button>
      </form>
    </div>
  );
}
