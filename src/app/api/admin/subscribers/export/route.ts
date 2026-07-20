import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { demoStore } from "@/lib/demo-admin-store";
import type { SubscriberRow } from "@/lib/article-repository";
import { isMysqlIntegrationEnabled, selectRows } from "@/lib/mysql";

export const runtime = "nodejs";
const csv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const subscribers = !isMysqlIntegrationEnabled()
      ? demoStore.subscribers
      : await selectRows<SubscriberRow>("SELECT id,name,email,language,status,subscribed_at FROM subscribers ORDER BY subscribed_at DESC");
    const body = [
      "Name,Email,Language,Status,Subscription Date",
      ...subscribers.map((subscriber) => [
        subscriber.name,
        subscriber.email,
        subscriber.language,
        subscriber.status,
        "subscribedAt" in subscriber ? subscriber.subscribedAt : new Date(subscriber.subscribed_at).toISOString(),
      ].map(csv).join(",")),
    ].join("\r\n");
    return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="shrimp-news-subscribers-${new Date().toISOString().slice(0, 10)}.csv"` } });
  } catch { return NextResponse.json({ error: "Unable to export subscribers." }, { status: 500 }); }
}
