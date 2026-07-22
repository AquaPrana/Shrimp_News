import "server-only";

import type { TickerItem } from "@prisma/client";
import { fallbackMarketPrices } from "@/data/fallback-market-prices";
import type { MarketPriceItem, MarketPricesApiResponse } from "@/lib/market-data/client";
import { logDatabaseError, prisma } from "@/lib/prisma";

/** Default Last Updated: 15 Jul 2026, 06:00 PM IST (UTC+5:30). */
export const DEFAULT_TICKER_LAST_UPDATED = new Date("2026-07-15T12:30:00.000Z");

export const TICKER_DIRECTIONS = ["up", "down", "neutral"] as const;
export type TickerDirection = (typeof TICKER_DIRECTIONS)[number];

function symbolFromLabel(label: string, id: string) {
  const normalized = label.trim().toLowerCase();
  const known = fallbackMarketPrices.find(
    (item) => item.label.toLowerCase() === normalized,
  );
  if (known) return known.symbol;

  const base = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || `ITEM_${id.slice(0, 8).toUpperCase()}`;
}

export function mapTickerItemToMarketPrice(item: TickerItem): MarketPriceItem {
  const updatedAt = item.updatedAt.toISOString();
  return {
    symbol: symbolFromLabel(item.label, item.id),
    label: item.label,
    price: item.price,
    currency: item.currency,
    unit: item.unit,
    changePercent: item.changePercent,
    direction: (TICKER_DIRECTIONS.includes(item.direction as TickerDirection)
      ? item.direction
      : "neutral") as TickerDirection,
    sourceName: "Admin",
    isLive: false,
    observedAt: updatedAt,
    updatedAt,
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
    const [meta, items] = await Promise.all([
      ensureTickerMeta(),
      prisma.tickerItem.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    if (items.length === 0) return null;

    return {
      items: items.map(mapTickerItemToMarketPrice),
      source: "admin-ticker",
      isFallback: false,
      fetchedAt: meta.lastUpdated.toISOString(),
    };
  } catch (error) {
    logDatabaseError("ticker.public", error);
    return null;
  }
}

export type TickerItemInput = {
  label: string;
  price: number;
  currency: string;
  unit: string;
  changePercent: number | null;
  direction: TickerDirection;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

export function validateTickerItemInput(raw: Record<string, unknown>) {
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!label) return { ok: false as const, error: "Item name is required." };
  if (label.length > 120) {
    return { ok: false as const, error: "Item name must be 120 characters or fewer." };
  }

  const price = typeof raw.price === "number" ? raw.price : Number(raw.price);
  if (!Number.isFinite(price)) {
    return { ok: false as const, error: "A valid price or value is required." };
  }

  const currency =
    typeof raw.currency === "string" && raw.currency.trim()
      ? raw.currency.trim().slice(0, 12)
      : "INR";
  const unit =
    typeof raw.unit === "string" && raw.unit.trim()
      ? raw.unit.trim().slice(0, 20)
      : "kg";

  let changePercent: number | null = null;
  if (raw.changePercent !== undefined && raw.changePercent !== null && raw.changePercent !== "") {
    const parsed =
      typeof raw.changePercent === "number"
        ? raw.changePercent
        : Number(raw.changePercent);
    if (!Number.isFinite(parsed)) {
      return { ok: false as const, error: "Percentage change must be a number." };
    }
    changePercent = parsed;
  }

  const directionRaw =
    typeof raw.direction === "string" ? raw.direction.trim().toLowerCase() : "neutral";
  if (!TICKER_DIRECTIONS.includes(directionRaw as TickerDirection)) {
    return { ok: false as const, error: "Choose increase, decrease, or neutral." };
  }

  const sortOrder =
    raw.sortOrder === undefined || raw.sortOrder === null || raw.sortOrder === ""
      ? 0
      : typeof raw.sortOrder === "number"
        ? raw.sortOrder
        : Number(raw.sortOrder);
  if (!Number.isFinite(sortOrder)) {
    return { ok: false as const, error: "Sort order must be a number." };
  }

  const updatedRaw =
    typeof raw.updatedAt === "string"
      ? raw.updatedAt.trim()
      : raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : "";
  const updatedAt = updatedRaw ? new Date(updatedRaw) : null;
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
    return { ok: false as const, error: "A valid updated date and time is required." };
  }

  const value: TickerItemInput = {
    label,
    price,
    currency,
    unit,
    changePercent,
    direction: directionRaw as TickerDirection,
    sortOrder: Math.trunc(sortOrder),
    isActive: raw.isActive !== false,
    updatedAt,
  };

  return { ok: true as const, value };
}
