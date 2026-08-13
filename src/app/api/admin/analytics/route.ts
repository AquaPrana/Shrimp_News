import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { ga4Configured, getAnalyticsReport } from "@/lib/ga4-reporting";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function validDate(value: string | null) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null; }

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  if (!ga4Configured()) return NextResponse.json({ success: true, configured: false });
  const url = new URL(request.url); const preset = url.searchParams.get("range") || "30";
  const end = validDate(url.searchParams.get("end")) || isoDate(new Date());
  const days = preset === "today" ? 1 : preset === "7" ? 7 : 30;
  const endDate = new Date(`${end}T12:00:00Z`);
  const start = preset === "custom" ? validDate(url.searchParams.get("start")) : null;
  const startDate = start || isoDate(new Date(endDate.getTime() - (days - 1) * 86_400_000));
  const duration = Math.round((endDate.getTime() - new Date(`${startDate}T12:00:00Z`).getTime()) / 86_400_000) + 1;
  const previousEndDate = new Date(new Date(`${startDate}T12:00:00Z`).getTime() - 86_400_000);
  const previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86_400_000);
  try {
    const [report, tickerItems] = await Promise.all([
      getAnalyticsReport(startDate, end, isoDate(previousStartDate), isoDate(previousEndDate)),
      prisma.tickerItem.findMany({ select: { id: true, isActive: true } }),
    ]);
    const statuses = new Map(tickerItems.map((item) => [item.id, item.isActive ? "Active" : "Inactive"]));
    return NextResponse.json({ success: true, configured: true, range: { startDate, endDate: end }, ...report, tickers: report.tickers.map((item) => ({ ...item, status: statuses.get(item.id) || "Ended" })) });
  } catch (error) {
    console.error("GA4 report failed", error);
    return NextResponse.json({ success: false, configured: true, message: error instanceof Error ? error.message : "Unable to retrieve Google Analytics data." }, { status: 502 });
  }
}
