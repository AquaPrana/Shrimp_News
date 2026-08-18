import { NextResponse } from "next/server";
import { getTickerPayloadFromDatabase } from "@/lib/ticker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const fromDb = await getTickerPayloadFromDatabase();
  if (fromDb) {
    return NextResponse.json(fromDb);
  }

  return NextResponse.json(
    {
      items: [],
      source: "admin-ticker-unavailable",
      isFallback: false,
      fetchedAt: "",
    },
    { status: 503 },
  );
}
