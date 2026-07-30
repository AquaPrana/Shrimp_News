import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    const body = await request.json() as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, message: "At least one reordered item is required." }, { status: 400 });
    }
    const parsed = body.items.map((item) => {
      const row = item as { id?: unknown; displayOrder?: unknown };
      return {
        id: typeof row.id === "string" ? row.id.trim() : "",
        displayOrder: Number(row.displayOrder),
      };
    });
    if (parsed.some((item) => !item.id || !Number.isInteger(item.displayOrder))) {
      return NextResponse.json({ success: false, message: "Each item needs a valid id and numerical order." }, { status: 400 });
    }
    if (new Set(parsed.map((item) => item.id)).size !== parsed.length) {
      return NextResponse.json({ success: false, message: "The reorder request contains duplicate item ids." }, { status: 400 });
    }
    await prisma.$transaction(parsed.map((item) =>
      prisma.tickerItem.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder, sortOrder: item.displayOrder },
      }),
    ));
    return NextResponse.json({ success: true, message: "Ticker order saved successfully." });
  } catch (error) {
    logDatabaseError("admin.ticker.reorder", error);
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: "Invalid request data." }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to complete the request." }, { status: 500 });
  }
}
