import type { Prisma } from "@prisma/client";

export const ARTICLE_TIMEZONE = "Asia/Kolkata";
export const ARTICLE_TIMEZONE_LABEL = "India Standard Time (IST, UTC+05:30)";

type Publication = { isPublished: boolean; scheduledAt?: Date | string | null; publishedAt?: Date | string | null };

export function articleStatus(article: Publication, now = new Date()) {
  if (article.scheduledAt && new Date(article.scheduledAt) > now) return "scheduled";
  if (article.isPublished || article.scheduledAt) return "published";
  return "draft";
}

/** Use with AND so category/search OR clauses cannot bypass visibility. */
export function publicArticleWhere(now = new Date()): Prisma.ArticleWhereInput {
  return { OR: [
    { isPublished: true, scheduledAt: null },
    { scheduledAt: { lte: now } },
  ] };
}

export function scheduleFields(value?: string | Date | null) {
  if (!value) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ARTICLE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function scheduleFromFields(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const instant = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(instant.getTime())) return null;
  const roundtrip = scheduleFields(instant);
  return roundtrip.date === date && roundtrip.time === time ? instant.toISOString() : null;
}

export function formatArticleSchedule(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: ARTICLE_TIMEZONE, day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(value)) + " IST";
}

/** Keep legacy boolean publishing requests working; only explicit scheduling sets a date. */
export function validateArticlePublication(raw: Record<string, unknown>, existing?: Publication, now = new Date()) {
  const mode = raw.publishOption;
  if (mode !== undefined && !["draft", "now", "schedule"].includes(String(mode))) {
    return { ok: false as const, error: "Choose a valid publish option." };
  }
  if (mode === "schedule") {
    const value = raw.scheduledAt;
    const parts = typeof value === "string"
      ? /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value)
      : null;
    const calendarDate = parts ? new Date(`${parts[1]}T00:00:00Z`) : null;
    const validCalendar = calendarDate && Number.isFinite(calendarDate.getTime())
      && calendarDate.toISOString().slice(0, 10) === parts?.[1];
    const scheduledAt = parts && validCalendar && Number(parts[2]) < 24
      && Number(parts[3]) < 60 && Number(parts[4] || 0) < 60 ? new Date(value as string) : null;
    if (!scheduledAt || !Number.isFinite(scheduledAt.getTime()) || scheduledAt <= now) {
      return { ok: false as const, error: "Choose a valid schedule in the future." };
    }
    return { ok: true as const, value: { isPublished: false, scheduledAt, publishedAt: null } };
  }
  // Content-only updates must retain their existing schedule, including overdue jobs.
  if (mode === undefined && raw.isPublished === undefined && existing) {
    return { ok: true as const, value: {
      isPublished: existing.isPublished,
      scheduledAt: existing.scheduledAt ? new Date(existing.scheduledAt) : null,
      publishedAt: existing.publishedAt ? new Date(existing.publishedAt) : null,
    } };
  }
  const isPublished = mode === "now" || (mode === undefined && raw.isPublished === true);
  const previousPublication = existing?.publishedAt || (
    existing?.scheduledAt && new Date(existing.scheduledAt) <= now ? existing.scheduledAt : null
  );
  return { ok: true as const, value: {
    isPublished, scheduledAt: null,
    publishedAt: isPublished ? (previousPublication ? new Date(previousPublication) : now) : null,
  } };
}
