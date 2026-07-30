import "server-only";

import { normalizeArticleImageUrl, sanitizePlainText, slugify } from "@/lib/validation";
import type { EventRegion, EventStatus } from "@/lib/event-types";

export const EVENT_STATUSES = ["draft", "published", "unpublished"] as const;
export const EVENT_REGIONS = ["India", "International"] as const;

function optionalHttpUrl(raw: unknown, label: string) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: true as const, value: null };
  }
  try {
    const url = new URL(raw.trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return { ok: true as const, value: url.toString() };
  } catch {
    return { ok: false as const, error: `${label} must be a valid HTTP or HTTPS URL.` };
  }
}

function optionalDate(raw: unknown, label: string) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: true as const, value: null };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, error: `${label} is invalid.` };
  }
  return { ok: true as const, value: date };
}

export function validateEventInput(raw: Record<string, unknown>) {
  const title = sanitizePlainText(raw.title, 255);
  const slug = slugify(String(raw.slug || title));
  const venue = sanitizePlainText(raw.venue, 255);
  const category = sanitizePlainText(raw.category, 255);
  const region = sanitizePlainText(raw.region, 30) as EventRegion;
  const status = sanitizePlainText(raw.status, 30) as EventStatus;
  const start = optionalDate(raw.startDate, "Start date");
  const end = optionalDate(raw.endDate, "End date");
  const website = optionalHttpUrl(raw.officialWebsite, "Official website");
  const image = normalizeArticleImageUrl(raw.imageUrl);

  if (!title) return { ok: false as const, error: "Title is required." };
  if (!slug) return { ok: false as const, error: "A valid slug is required." };
  if (!start.ok || !start.value) {
    return { ok: false as const, error: start.ok ? "Start date is required." : start.error };
  }
  if (!end.ok) return end;
  if (end.value && end.value < start.value) {
    return { ok: false as const, error: "End date cannot be earlier than start date." };
  }
  if (!venue) return { ok: false as const, error: "Venue is required." };
  if (!category) return { ok: false as const, error: "Category is required." };
  if (!EVENT_REGIONS.includes(region)) {
    return { ok: false as const, error: "Choose India or International." };
  }
  if (!EVENT_STATUSES.includes(status)) {
    return { ok: false as const, error: "Choose draft, published, or unpublished." };
  }
  if (!website.ok) return website;
  if (!image.ok) return image;

  const order = Number(raw.displayOrder ?? 0);
  if (!Number.isFinite(order)) {
    return { ok: false as const, error: "Display order must be a number." };
  }

  return {
    ok: true as const,
    value: {
      title,
      slug,
      shortDescription: sanitizePlainText(raw.shortDescription, 10_000) || null,
      description: sanitizePlainText(raw.description, 500_000) || null,
      startDate: start.value,
      endDate: end.value,
      dateLabel: sanitizePlainText(raw.dateLabel, 255) || null,
      venue,
      duration: sanitizePlainText(raw.duration, 255) || null,
      category,
      region,
      audience: sanitizePlainText(raw.audience, 50_000) || null,
      imageUrl: image.value,
      officialWebsite: website.value,
      status,
      isFeatured: raw.isFeatured === true,
      displayOrder: Math.trunc(order),
    },
  };
}
