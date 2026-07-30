"use client";

import { use, useEffect, useState } from "react";
import { EventForm } from "@/components/admin/event-form";
import type { AdminEvent } from "@/lib/event-types";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/admin/events/${id}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json() as { event?: AdminEvent; error?: string };
        if (!response.ok || !body.event) throw new Error(body.error || "Unable to load event.");
        setEvent(body.event);
      } catch (value) {
        if ((value as Error).name !== "AbortError") setError(value instanceof Error ? value.message : "Unable to load event.");
      }
    })();
    return () => controller.abort();
  }, [id]);

  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>;
  if (!event) return <div role="status" className="rounded-2xl border bg-white p-10 text-center">Loading event…</div>;
  return <EventForm event={event} />;
}
