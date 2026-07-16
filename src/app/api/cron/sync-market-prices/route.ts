import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AquaBrahmaProvider } from "@/lib/market-data/providers/aquabrahma";
import { FallbackProvider } from "@/lib/market-data/providers/fallback";
import { MarketPriceInputSchema } from "@/lib/market-data/providers/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const providerName = process.env.MARKET_DATA_PROVIDER ?? "aquabrahma";
    const provider = providerName === "fallback"
      ? new FallbackProvider()
      : new AquaBrahmaProvider();

    const rawPrices = await provider.fetchPrices();
    const validPrices = rawPrices
      .map((item) => MarketPriceInputSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);

    const supabase = createClient();
    let updated = 0;
    let failed = 0;

    for (const price of validPrices) {
      const payload = {
        symbol: price.symbol,
        label: price.label,
        category: price.category,
        species: price.species ?? null,
        count_size: price.countSize ?? null,
        market: price.market ?? null,
        currency: price.currency,
        unit: price.unit,
        price: price.price,
        previous_price: price.previousPrice ?? null,
        change_value: price.changeValue ?? null,
        change_percent: price.changePercent ?? null,
        direction: price.direction,
        source_name: price.sourceName,
        source_url: price.sourceUrl ?? null,
        is_live: price.isLive,
        is_active: price.isActive,
        observed_at: price.observedAt,
        updated_at: price.updatedAt,
        created_at: new Date().toISOString(),
        display_order: null,
      };

      const { error } = await supabase.from("market_prices").upsert(payload, { onConflict: "symbol" });
      if (error) {
        failed += 1;
        console.error("Failed to upsert market price", { symbol: price.symbol, error: error.message });
      } else {
        updated += 1;
      }
    }

    return NextResponse.json({
      success: true,
      provider: providerName,
      received: validPrices.length,
      updated,
      failed,
    });
  } catch (error) {
    console.error("Market price sync failed", error);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
