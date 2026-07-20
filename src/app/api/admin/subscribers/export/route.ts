import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const csv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    const body = [
      "Email,Subscription Date",
      ...subscribers.map((subscriber) => [subscriber.email, subscriber.createdAt.toISOString()].map(csv).join(",")),
    ].join("\r\n");
    return new Response(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="shrimp-news-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    logDatabaseError("subscribers.export", error);
    return NextResponse.json({ error: "Unable to export subscribers." }, { status: 500 });
  }
}
