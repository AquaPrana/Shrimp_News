"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicEvent, EventRegion } from "@/lib/event-types";

type EventFilter = "All" | EventRegion;

const filters: EventFilter[] = ["All", "India", "International"];

function EventCard({ event }: { event: PublicEvent }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_18px_44px_rgba(11,79,122,0.13)]">
      <Link href={`/events/${event.slug}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#EAF6FB] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#0B4F7A]">
            {event.region}
          </span>
          <time
            dateTime={event.date}
            className="text-xs font-semibold text-slate-500"
          >
            {event.shortDateLabel}
          </time>
        </div>

        <h2 className="mt-4 text-xl font-extrabold leading-snug text-[#0B3A6E] transition-colors group-hover:text-[#FF5A36]">
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h2>

        <dl className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
          <div>
            <dt className="inline font-bold text-slate-800">Venue: </dt>
            <dd className="inline">{event.venue}</dd>
          </div>
          <div>
            <dt className="inline font-bold text-slate-800">Duration: </dt>
            <dd className="inline">{event.duration}</dd>
          </div>
          <div>
            <dt className="inline font-bold text-slate-800">Category: </dt>
            <dd className="inline">{event.category}</dd>
          </div>
        </dl>

        <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">
          {event.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-[#0B4F7A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#083E61]"
          >
            View Details
          </Link>
          {event.officialWebsite ? (
            <a
              href={event.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#0B4F7A] px-4 py-2.5 text-xs font-bold text-[#0B4F7A] transition hover:bg-[#EAF6FB]"
            >
              Official Website
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function EventsPageClient({ events }: { events: PublicEvent[] }) {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("All");
  const filteredEvents = useMemo(
    () =>
      activeFilter === "All"
        ? events
        : events.filter((event) => event.region === activeFilter),
    [activeFilter, events],
  );

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600 sm:text-sm">
            Events
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
            Shrimp &amp; Seafood Industry Events
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Stay informed about upcoming shrimp and seafood industry events
            from India and around the world. Explore expos, trade shows,
            conferences, summits, workshops, and networking events that bring
            together farmers, exporters, processors, researchers, buyers,
            policymakers, and industry leaders.
          </p>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter events by region"
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={active}
                className={`rounded-full border px-5 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-[#0B4F7A] bg-[#0B4F7A] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#0B4F7A] hover:text-[#0B4F7A]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
