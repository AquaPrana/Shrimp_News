import "server-only";

import type { TickerItem } from "@prisma/client";
import { normalizeArticleImageUrl, sanitizePlainText } from "@/lib/validation";
import {
  TICKER_ITEM_TYPES,
  type MarketPriceItem,
  type MarketPricesApiResponse,
  type TickerItemType,
} from "@/lib/market-data/client";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const DEFAULT_TICKER_LAST_UPDATED = new Date("2026-07-15T12:30:00.000Z");

export function mapTickerItem(item: TickerItem): MarketPriceItem {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
    description: item.description,
    type: TICKER_ITEM_TYPES.includes(item.type as TickerItemType)
      ? item.type as TickerItemType
      : "market",
    linkUrl: item.linkUrl,
    linkLabel: item.linkLabel,
    imageUrl: item.imageUrl,
    displayOrder: item.displayOrder,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function ensureTickerMeta() {
  return prisma.tickerMeta.upsert({
    where: { id: "default" },
    create: { id: "default", lastUpdated: DEFAULT_TICKER_LAST_UPDATED },
    update: {},
  });
}

export async function getTickerPayloadFromDatabase(): Promise<MarketPricesApiResponse | null> {
  try {
    const now = new Date();
    const [meta, items] = await Promise.all([
      ensureTickerMeta(),
      prisma.tickerItem.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      }),
    ]);
    return {
      items: items.map(mapTickerItem),
      source: "admin-ticker",
      isFallback: false,
      fetchedAt: meta.lastUpdated.toISOString(),
    };
  } catch (error) {
    logDatabaseError("ticker.public", error);
    return null;
  }
}

function optionalHttpUrl(raw: unknown, label: string) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: true as const, value: null };
  }
  try {
    const value = new URL(raw.trim());
    if (!["http:", "https:"].includes(value.protocol)) throw new Error();
    return { ok: true as const, value: value.toString() };
  } catch {
    return { ok: false as const, error: `${label} must be a valid HTTP or HTTPS URL.` };
  }
}

function optionalDate(raw: unknown, label: string) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: true as const, value: null };
  }
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    return { ok: false as const, error: `${label} is invalid.` };
  }
  return { ok: true as const, value };
}

export function validateTickerItemInput(raw: Record<string, unknown>) {
  const label = sanitizePlainText(raw.label, 120);
  const value = sanitizePlainText(raw.value, 190);
  const type = sanitizePlainText(raw.type, 30).toLowerCase() as TickerItemType;
  const linkUrl = optionalHttpUrl(raw.linkUrl, "Link URL");
  const imageUrl = normalizeArticleImageUrl(raw.imageUrl);
  const startsAt = optionalDate(raw.startsAt, "Start date");
  const endsAt = optionalDate(raw.endsAt, "End date");

  if (!label) return { ok: false as const, error: "Label is required." };
  if (!value) return { ok: false as const, error: "Value is required." };
  if (!TICKER_ITEM_TYPES.includes(type)) {
    return { ok: false as const, error: "Choose market, update, promotion, or announcement." };
  }
  if (!linkUrl.ok) return linkUrl;
  if (!imageUrl.ok) return imageUrl;
  if (!startsAt.ok) return startsAt;
  if (!endsAt.ok) return endsAt;
  if (startsAt.value && endsAt.value && endsAt.value < startsAt.value) {
    return { ok: false as const, error: "End date cannot be earlier than start date." };
  }
  const displayOrder = Number(raw.displayOrder ?? 0);
  if (!Number.isFinite(displayOrder)) {
    return { ok: false as const, error: "Display order must be a number." };
  }

  return {
    ok: true as const,
    value: {
      label,
      value,
      description: sanitizePlainText(raw.description, 10_000) || null,
      type,
      linkUrl: linkUrl.value,
      linkLabel: sanitizePlainText(raw.linkLabel, 120) || null,
      imageUrl: imageUrl.value,
      isActive: raw.isActive !== false,
      displayOrder: Math.trunc(displayOrder),
      startsAt: startsAt.value,
      endsAt: endsAt.value,
    },
  };
}
