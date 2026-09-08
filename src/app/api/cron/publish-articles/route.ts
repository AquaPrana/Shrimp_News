import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/newsletter/cron-authorization";
import { publishScheduledArticles } from "@/lib/publish-scheduled-articles";
import { logDatabaseError } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const published = await publishScheduledArticles();
    return NextResponse.json({ success: true, published }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logDatabaseError("articles.scheduled-publish", error);
    return NextResponse.json({ error: "Unable to publish scheduled articles." }, { status: 500 });
  }
}
