import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase();
    const rows = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 2_000,
    });
    const subscribers = q
      ? rows.filter((subscriber) => subscriber.email.toLowerCase().includes(q))
      : rows;
    return NextResponse.json({ subscribers, total: subscribers.length });
  } catch (error) {
    logDatabaseError("subscribers.list", error);
    return NextResponse.json({ error: "Unable to load subscribers." }, { status: 500 });
  }
}
