import "server-only";

import type { Event as PrismaEvent } from "@prisma/client";
import { events as fallbackEvents } from "@/data/events";
import type { PublicEvent } from "@/lib/event-types";
import { logDatabaseError, prisma } from "@/lib/prisma";

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function shortDateLabel(startDate: Date, endDate: Date | null) {
  const start = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(startDate);
  if (!endDate) return start;

  const sameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth();
  if (sameMonth) {
    const end = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(endDate);
    return `${startDate.getUTCDate()}–${end}`;
  }
  const end = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate);
  return `${start}–${end}`;
}

function fullDateLabel(startDate: Date, endDate: Date | null) {
  return shortDateLabel(startDate, endDate)
    .replace(/\bJan\b/, "January")
    .replace(/\bFeb\b/, "February")
    .replace(/\bMar\b/, "March")
    .replace(/\bApr\b/, "April")
    .replace(/\bJun\b/, "June")
    .replace(/\bJul\b/, "July")
    .replace(/\bAug\b/, "August")
    .replace(/\bSep\b/, "September")
    .replace(/\bOct\b/, "October")
    .replace(/\bNov\b/, "November")
    .replace(/\bDec\b/, "December");
}

function fallbackLocation(slug: string, venue: string) {
  return fallbackEvents.find((event) => event.slug === slug)?.locationLabel || venue;
}

export function mapEventToPublic(event: PrismaEvent): PublicEvent {
  const known = fallbackEvents.find((item) => item.slug === event.slug);
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    date: dateOnly(event.startDate),
    endDate: event.endDate ? dateOnly(event.endDate) : undefined,
    dateLabel:
      event.dateLabel || fullDateLabel(event.startDate, event.endDate),
    shortDateLabel:
      known?.shortDateLabel || shortDateLabel(event.startDate, event.endDate),
    venue: event.venue,
    locationLabel: fallbackLocation(event.slug, event.venue),
    duration: event.duration || "",
    category: event.category,
    region: event.region === "International" ? "International" : "India",
    audience: event.audience
      ? event.audience.split(/\r?\n|,\s*/).map((item) => item.trim()).filter(Boolean)
      : [],
    shortDescription: event.shortDescription || undefined,
    description: event.description || event.shortDescription || "",
    image:
      event.imageUrl ||
      known?.image ||
      "/images/articles/global-market.jpeg",
    officialWebsite: event.officialWebsite || undefined,
    isFeatured: event.isFeatured,
    displayOrder: event.displayOrder,
  };
}

function fallbackPublishedEvents(): PublicEvent[] {
  return fallbackEvents.map((event, displayOrder) => ({
    ...event,
    isFeatured: displayOrder === 0,
    displayOrder,
  }));
}

export async function getPublishedEvents(): Promise<PublicEvent[]> {
  try {
    const rows = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }, { id: "asc" }],
    });
    return rows.map(mapEventToPublic);
  } catch (error) {
    logDatabaseError("events.public", error);
    return fallbackPublishedEvents();
  }
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEvent | null> {
  try {
    const event = await prisma.event.findFirst({
      where: { slug, status: "published" },
    });
    if (event) return mapEventToPublic(event);
  } catch (error) {
    logDatabaseError("events.public.detail", error);
    const fallback = fallbackPublishedEvents().find((item) => item.slug === slug);
    return fallback || null;
  }
  return null;
}
