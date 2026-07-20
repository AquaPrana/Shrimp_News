import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { demoStore } from "@/lib/demo-admin-store";
import { execute, isMysqlIntegrationEnabled } from "@/lib/mysql";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: "active" | "unsubscribed" };
  if (!body.status || !["active", "unsubscribed"].includes(body.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (!isMysqlIntegrationEnabled()) {
    const subscriber = demoStore.subscribers.find((item) => item.id === id);
    if (!subscriber) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    subscriber.status = body.status;
    return NextResponse.json({ message: "Subscriber updated." });
  }
  try {
    const result = await execute("UPDATE subscribers SET status=? WHERE id=?", [body.status, id]);
    return result.affectedRows ? NextResponse.json({ message: "Subscriber updated." }) : NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Unable to update subscriber." }, { status: 500 }); }
}
