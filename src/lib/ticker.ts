import "server-only";

import type { TickerItem } from "@prisma/client";
import { normalizeArticleImageUrl, sanitizePlainText } from "@/lib/validation";
import {
  TICKER_ITEM_TYPES,
  normalizeTickerItemType,
  type MarketPriceItem,
  type MarketPricesApiResponse,
  type TickerItemType,
} from "@/lib/market-data/client";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { normalizeTickerUrl } from "@/lib/ticker-url";

export const DEFAULT_TICKER_LAST_UPDATED = new Date("2026-07-15T12:30:00.000Z");

export function mapTickerItem(item: TickerItem): MarketPriceItem {
  const safeLinkUrl = normalizeTickerUrl(item.linkUrl);
  return {
    id: item.id,
    label: item.label,
    value: item.value,
    description: item.description,
    type: normalizeTickerItemType(item.type),
    linkUrl: safeLinkUrl.ok ? safeLinkUrl.value : null,
    linkLabel: item.linkLabel,
    imageUrl: item.imageUrl,
    couponCode: item.couponCode,
    campaignName: item.campaignName || item.label,
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
  const linkUrl = normalizeTickerUrl(raw.linkUrl);
  const imageUrl = normalizeArticleImageUrl(raw.imageUrl);
  const startsAt = optionalDate(raw.startsAt, "Start date");
  const endsAt = optionalDate(raw.endsAt, "End date");
  const expiryDate = optionalDate(raw.expiryDate, "Expiry date");

  const species = sanitizePlainText(raw.species, 120) || (type === "market" ? label : "");
  const company = sanitizePlainText(raw.company, 120);
  const product = sanitizePlainText(raw.product, 120);
  const couponCode = sanitizePlainText(raw.couponCode, 80);

  if (!label) return { ok: false as const, error: "Title is required." };
  if (!value) return { ok: false as const, error: "Ticker content is required." };
  if (!TICKER_ITEM_TYPES.includes(type)) {
    return { ok: false as const, error: "Choose a valid ticker type." };
  }
  if (!linkUrl.ok) return linkUrl;
  if (!imageUrl.ok) return imageUrl;
  if (!startsAt.ok) return startsAt;
  if (!endsAt.ok) return endsAt;
  if (!expiryDate.ok) return expiryDate;
  if (startsAt.value && endsAt.value && endsAt.value < startsAt.value) {
    return { ok: false as const, error: "End date cannot be earlier than start date." };
  }
  const displayOrder = Number(raw.displayOrder ?? 0);
  if (!Number.isFinite(displayOrder)) {
    return { ok: false as const, error: "Display order must be a number." };
  }
  const price = Number(raw.price ?? 0);
  const priceChange = raw.priceChange === null || raw.priceChange === "" || raw.priceChange === undefined
    ? null
    : Number(raw.priceChange);
  if (!Number.isFinite(price) || (priceChange !== null && !Number.isFinite(priceChange))) {
    return { ok: false as const, error: "Price and price change must be valid numbers." };
  }
  if (type === "market" && (!species || price <= 0)) {
    return { ok: false as const, error: "Shrimp species / grade and a price greater than zero are required." };
  }
  if (type === "feed" && ((!company && !product) || price <= 0)) {
    return { ok: false as const, error: "Feed company or product and a price greater than zero are required." };
  }
  if (type === "external_link" && !linkUrl.value) {
    return { ok: false as const, error: "Website URL is required for a website link." };
  }
  if (type === "coupon" && !couponCode) {
    return { ok: false as const, error: "Coupon code is required." };
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
      price,
      currency: "INR",
      unit: sanitizePlainText(raw.unit, 30) || "",
      changePercent: priceChange,
      direction: priceChange === null ? "neutral" : priceChange > 0 ? "up" : priceChange < 0 ? "down" : "neutral",
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      species: species || null,
      location: sanitizePlainText(raw.location, 120) || null,
      company: company || null,
      product: product || null,
      bagSize: sanitizePlainText(raw.bagSize, 60) || null,
      couponCode: couponCode || null,
      expiryDate: expiryDate.value,
      campaignName: sanitizePlainText(raw.campaignName, 160) || label,
    },
  };
}
