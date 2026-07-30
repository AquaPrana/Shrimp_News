import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedEventBySlug } from "@/lib/events";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    return { title: "Event not found | Shrimp.News" };
  }

  return {
    title: `${event.title} | Shrimp.News`,
    description: event.description,
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) notFound();

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <Link
          href="/events"
          className="inline-flex text-sm font-bold text-[#0B4F7A] transition hover:text-[#FF5A36] hover:underline"
        >
          ← Back to Events
        </Link>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_46px_rgba(15,23,42,0.09)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <span className="w-fit rounded-full bg-[#EAF6FB] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#0B4F7A]">
                {event.region}
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>
              <p className="mt-5 text-lg font-semibold text-slate-700">
                <time dateTime={event.date}>{event.dateLabel}</time>
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                {event.venue}
              </p>
            </div>

            <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[440px]">
              <Image
                src={event.image}
                alt={event.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
          <article className="rounded-[28px] border border-slate-200 bg-[#F7FBFF] p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-8">
            <h2 className="text-2xl font-extrabold text-[#0B3A6E]">
              About the Event
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">
              {event.description.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-9 text-2xl font-extrabold text-[#0B3A6E]">
              Audience
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {event.audience.map((audience) => (
                <li
                  key={audience}
                  className="rounded-full border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {audience}
                </li>
              ))}
            </ul>
          </article>

          <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0B3A6E]">
              Event Details
            </h2>
            <dl className="mt-5 divide-y divide-slate-200 text-sm">
              {[
                ["Date", event.dateLabel],
                ["Venue", event.venue],
                ["Duration", event.duration],
                ["Category", event.category],
                ["Region", event.region],
              ].map(([label, value]) => (
                <div key={label} className="py-4 first:pt-0 last:pb-0">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1.5 leading-6 text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>

            {event.officialWebsite ? (
              <a
                href={event.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#0B4F7A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#083E61]"
              >
                Official Website
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
