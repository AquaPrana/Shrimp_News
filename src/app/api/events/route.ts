import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getPublishedEvents();
  return NextResponse.json({ events });
}
