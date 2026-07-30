"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import type { PublicEvent } from "@/lib/event-types";

export function EventsGrid({
  lead,
  supporting,
}: {
  lead: PublicEvent | null;
  supporting: PublicEvent[];
}) {
  const { t } = useLanguage();
  if (!lead) return null;

  return (
    <section className="min-w-0">
      <div className="mb-7 flex items-end justify-between border-b-2 border-[#0B4F7A]">
        <h2 className="bg-[#0B4F7A] px-5 py-3 text-base font-black uppercase tracking-[0.08em] text-white sm:text-lg">
          Events
        </h2>
        <Link
          href="/events"
          className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0B4F7A] transition hover:text-[#ff5a2f] hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <article className="group min-w-0">
          <Link href={`/events/${lead.slug}`} className="block">
            <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
              <Image
                src={lead.image}
                alt={lead.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                sizes="(max-width: 768px) 100vw, 38vw"
              />
            </div>
            <h3 className="article-title mt-4 text-2xl font-extrabold leading-tight text-slate-900 transition-colors group-hover:text-[#0B4F7A]">
              {lead.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <time dateTime={lead.date}>{lead.shortDateLabel}</time>
              <span aria-hidden="true">•</span>
              <span className="font-semibold text-[#0B4F7A]">{lead.region}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {lead.locationLabel}
            </p>
          </Link>
        </article>

        <div className="min-w-0 divide-y divide-slate-200">
          {supporting.map((event) => (
            <article
              key={`event-list-${event.slug}`}
              className="group py-3 first:pt-0 last:pb-0"
            >
              <Link
                href={`/events/${event.slug}`}
                className="grid grid-cols-[128px_minmax(0,1fr)] gap-4 sm:grid-cols-[150px_minmax(0,1fr)] md:grid-cols-[128px_minmax(0,1fr)] xl:grid-cols-[145px_minmax(0,1fr)]"
              >
                <div className="relative h-[88px] overflow-hidden bg-slate-100 sm:h-[96px]">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 150px, 145px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="article-title line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0B4F7A] sm:text-base">
                    {event.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                    <time dateTime={event.date}>{event.shortDateLabel}</time>
                    <span aria-hidden="true">•</span>
                    <span className="truncate font-semibold text-[#0B4F7A]">
                      {event.region}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {event.locationLabel}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
