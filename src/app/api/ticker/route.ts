import { NextResponse } from "next/server";
import { getTickerPayloadFromDatabase } from "@/lib/ticker";
import { buildDemoMarketPricesPayload } from "@/lib/market-data/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const fromDb = await getTickerPayloadFromDatabase();
  if (fromDb) {
    return NextResponse.json(fromDb);
  }

  // Fallback only until admin has saved at least one ticker item.
  return NextResponse.json(buildDemoMarketPricesPayload());
}
