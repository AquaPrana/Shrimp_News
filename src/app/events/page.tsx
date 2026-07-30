import type { Metadata } from "next";
import { EventsPageClient } from "@/components/events/events-page-client";
import { getPublishedEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Shrimp & Seafood Industry Events | Shrimp.News",
  description:
    "Explore upcoming shrimp and seafood expos, conferences, summits, workshops, and networking events in India and around the world.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <EventsPageClient events={events} />;
}
