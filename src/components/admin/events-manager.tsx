"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminEvent } from "@/lib/event-types";

type Filters = {
  search: string;
  region: string;
  category: string;
  status: string;
  featured: string;
  date: string;
};

const emptyFilters: Filters = {
  search: "",
  region: "",
  category: "",
  status: "",
  featured: "",
  date: "",
};

function displayDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function EventsManager() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(applied).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const response = await fetch(`/api/admin/events?${query}`, { cache: "no-store" });
      const body = await response.json() as { events?: AdminEvent[]; categories?: string[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load events.");
      setEvents(body.events || []);
      setCategories(body.categories || []);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function changeStatus(event: AdminEvent, status: "published" | "unpublished") {
    setBusyId(event.id);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/admin/events/${event.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Unable to update status.");
      setMessage(body.message || "Event status updated.");
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setBusyId("");
    }
  }

  async function remove(event: AdminEvent) {
    if (!window.confirm(`Delete “${event.title}”? This only deletes this event record.`)) return;
    setBusyId(event.id);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Unable to delete event.");
      setMessage(body.message || "Event deleted.");
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to delete event.");
    } finally {
      setBusyId("");
    }
  }

  const input = "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Content</p>
          <h1 className="mt-2 text-3xl font-extrabold">Events Management</h1>
          <p className="mt-2 text-slate-600">Add, publish, feature, order, and update public events.</p>
        </div>
        <Link href="/admin/events/new" className="inline-flex h-11 items-center rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white">
          Add Event
        </Link>
      </header>

      {message ? (
        <div role={isError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div>
      ) : null}

      <form
        onSubmit={(e) => { e.preventDefault(); setApplied(filters); }}
        className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <input aria-label="Search by event title" placeholder="Search event title" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className={input} />
        <select aria-label="Region" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} className={input}>
          <option value="">All regions</option><option value="India">India</option><option value="International">International</option>
        </select>
        <select aria-label="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className={input}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select aria-label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={input}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option>
        </select>
        <select aria-label="Featured status" value={filters.featured} onChange={(e) => setFilters({ ...filters, featured: e.target.value })} className={input}>
          <option value="">Featured or not</option><option value="true">Featured</option><option value="false">Not featured</option>
        </select>
        <input aria-label="Start date" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className={input} />
        <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">Apply filters</button>
        <button type="button" onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); }} className="h-10 rounded-xl border px-4 text-sm font-bold">Clear</button>
      </form>

      <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[1450px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {["Event", "Start", "End", "Venue", "Category", "Region", "Featured", "Status", "Order", "Created", "Updated", "Actions"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={12} className="p-10 text-center">Loading events…</td></tr>
            ) : events.length ? events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-4">
                  <div className="flex w-64 items-center gap-3">
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{event.imageUrl ? <img src={event.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
                    <p className="font-semibold">{event.title}</p>
                  </div>
                </td>
                <td className="px-4">{displayDate(event.startDate)}</td>
                <td className="px-4">{displayDate(event.endDate)}</td>
                <td className="max-w-60 px-4">{event.venue}</td>
                <td className="px-4">{event.category}</td>
                <td className="px-4">{event.region}</td>
                <td className="px-4">{event.isFeatured ? "Yes" : "No"}</td>
                <td className="px-4 capitalize">{event.status}</td>
                <td className="px-4">{event.displayOrder}</td>
                <td className="px-4">{displayDate(event.createdAt)}</td>
                <td className="px-4">{displayDate(event.updatedAt)}</td>
                <td className="px-4">
                  <div className="flex flex-wrap gap-2">
                    {event.status === "published" ? <Link target="_blank" rel="noopener noreferrer" href={`/events/${event.slug}`} className="rounded-lg border px-3 py-1.5 text-xs font-bold">View</Link> : null}
                    <Link href={`/admin/events/${event.id}/edit`} className="rounded-lg border px-3 py-1.5 text-xs font-bold">Edit</Link>
                    <button type="button" disabled={busyId === event.id} onClick={() => void changeStatus(event, event.status === "published" ? "unpublished" : "published")} className="rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50">
                      {event.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" disabled={busyId === event.id} onClick={() => void remove(event)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={12} className="p-10 text-center text-slate-500">No events match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
