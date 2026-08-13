import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { ensureTickerMeta, validateTickerItemInput } from "@/lib/ticker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  try {
    const [meta, items] = await Promise.all([
      ensureTickerMeta(),
      prisma.tickerItem.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);
    return NextResponse.json({
      success: true,
      items: items.map((item) => ({ ...item, type: item.type === "update" ? "external_link" : item.type })),
      lastUpdated: meta.lastUpdated.toISOString(),
    });
  } catch (error) {
    logDatabaseError("admin.ticker.list", error);
    return NextResponse.json(
      { success: false, message: "Unable to load ticker items." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "updateLastUpdated") {
      const lastUpdated = typeof body.lastUpdated === "string" ? new Date(body.lastUpdated) : null;
      if (!lastUpdated || Number.isNaN(lastUpdated.getTime())) {
        return NextResponse.json(
          { success: false, message: "A valid last updated date and time is required." },
          { status: 400 },
        );
      }
      const meta = await prisma.tickerMeta.upsert({
        where: { id: "default" },
        create: { id: "default", lastUpdated },
        update: { lastUpdated },
      });
      return NextResponse.json({
        success: true,
        message: "Ticker Last Updated saved successfully.",
        lastUpdated: meta.lastUpdated.toISOString(),
      });
    }

    const validated = validateTickerItemInput(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, message: validated.error },
        { status: 400 },
      );
    }
    const item = await prisma.tickerItem.create({
      data: {
        ...validated.value,
        sortOrder: validated.value.displayOrder,
      },
    });
    return NextResponse.json(
      { success: true, item, message: "Ticker item added successfully." },
      { status: 201 },
    );
  } catch (error) {
    logDatabaseError("admin.ticker.create", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unable to complete the request." },
      { status: 500 },
    );
  }
}
