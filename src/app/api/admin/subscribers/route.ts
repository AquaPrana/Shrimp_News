import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { demoStore } from "@/lib/demo-admin-store";
import { mapSubscriber, type SubscriberRow } from "@/lib/article-repository";
import { isMysqlIntegrationEnabled, selectRows } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase();
  const language = url.searchParams.get("language");
  const status = url.searchParams.get("status");
  if (!isMysqlIntegrationEnabled()) {
    const subscribers = demoStore.subscribers.filter((subscriber) =>
      (!q || subscriber.email.toLowerCase().includes(q) || subscriber.name?.toLowerCase().includes(q)) &&
      (!language || subscriber.language === language) && (!status || subscriber.status === status),
    ).sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
    return NextResponse.json({ subscribers, total: subscribers.length });
  }
  try {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (q) { clauses.push("(email LIKE ? OR name LIKE ?)"); values.push(`%${q}%`, `%${q}%`); }
    if (language) { clauses.push("language=?"); values.push(language); }
    if (status) { clauses.push("status=?"); values.push(status); }
    const rows = await selectRows<SubscriberRow>(`SELECT id,name,email,language,status,subscribed_at FROM subscribers ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY subscribed_at DESC LIMIT 2000`, values);
    return NextResponse.json({ subscribers: rows.map(mapSubscriber), total: rows.length });
  } catch { return NextResponse.json({ error: "Unable to load subscribers." }, { status: 500 }); }
}
