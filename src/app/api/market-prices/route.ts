import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fallbackMarketPrices } from "@/data/fallback-market-prices";
import { MarketPriceInputSchema } from "@/lib/market-data/providers/types";

export const dynamic = "force-dynamic";

const SUPABASE_TIMEOUT_MS = 2500;

function fallbackPayload() {
  return {
    items: fallbackMarketPrices.map((item) => ({
      symbol: item.symbol,
      label: item.label,
      price: item.price,
      currency: item.currency,
      unit: item.unit,
      changePercent: item.changePercent ?? null,
      direction: item.direction,
      sourceName: item.sourceName,
      isLive: item.isLive,
      observedAt: item.observedAt,
      updatedAt: item.updatedAt,
    })),
    source: "fallback",
    isFallback: true,
    fetchedAt: new Date().toISOString(),
  };
}

function responseHeaders() {
  return {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "CDN-Cache-Control": "public, s-maxage=60",
    Vary: "Accept-Encoding",
  };
}

export async function GET() {
  try {
    const supabase = createClient();

    const queryPromise = supabase
      .from("market_prices")
      .select(
        "symbol,label,category,species,count_size,market,currency,unit,price,previous_price,change_value,change_percent,direction,source_name,source_url,is_live,is_active,observed_at,updated_at",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("label", { ascending: true })
      .limit(20);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Market prices query timed out"));
      }, SUPABASE_TIMEOUT_MS);
    });

    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise,
    ]);

    if (error) {
      throw error;
    }

    const items = (data ?? [])
      .map((record) => {
        const parsed = MarketPriceInputSchema.safeParse({
          symbol: record.symbol,
          label: record.label,
          category: record.category,
          species: record.species,
          countSize: record.count_size,
          market: record.market,
          currency: record.currency ?? "INR",
          unit: record.unit ?? "kg",
          price: Number(record.price),
          previousPrice:
            record.previous_price == null
              ? null
              : Number(record.previous_price),
          changeValue:
            record.change_value == null ? null : Number(record.change_value),
          changePercent:
            record.change_percent == null
              ? null
              : Number(record.change_percent),
          direction: record.direction,
          sourceName: record.source_name,
          sourceUrl: record.source_url,
          isLive: Boolean(record.is_live),
          isActive: Boolean(record.is_active),
          observedAt: record.observed_at,
          updatedAt: record.updated_at,
        });

        if (!parsed.success) {
          return null;
        }

        return {
          symbol: parsed.data.symbol,
          label: parsed.data.label,
          price: parsed.data.price,
          currency: parsed.data.currency,
          unit: parsed.data.unit,
          changePercent: parsed.data.changePercent ?? null,
          direction: parsed.data.direction,
          sourceName: parsed.data.sourceName,
          isLive: parsed.data.isLive,
          observedAt: parsed.data.observedAt,
          updatedAt: parsed.data.updatedAt,
        };
      })
      .filter(Boolean);

    if (items.length === 0) {
      return NextResponse.json(fallbackPayload(), {
        headers: responseHeaders(),
      });
    }

    return NextResponse.json(
      {
        items,
        source: "supabase",
        isFallback: false,
        fetchedAt: new Date().toISOString(),
      },
      { headers: responseHeaders() },
    );
  } catch (error) {
    console.error("Market prices API fallback triggered", error);
    return NextResponse.json(fallbackPayload(), {
      headers: responseHeaders(),
    });
  }
}
