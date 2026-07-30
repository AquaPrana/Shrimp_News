import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { validateTickerItemInput } from "@/lib/ticker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    const item = await prisma.tickerItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ success: false, message: "Ticker item not found." }, { status: 404 });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    logDatabaseError("admin.ticker.get", error);
    return NextResponse.json({ success: false, message: "Unable to complete the request." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const validated = validateTickerItemInput(body);
    if (!validated.ok) return NextResponse.json({ success: false, message: validated.error }, { status: 400 });
    const item = await prisma.tickerItem.update({
      where: { id },
      data: { ...validated.value, sortOrder: validated.value.displayOrder },
    });
    return NextResponse.json({ success: true, item, message: "Ticker item updated successfully." });
  } catch (error) {
    logDatabaseError("admin.ticker.update", error);
    if (prismaErrorCode(error) === "P2025") return NextResponse.json({ success: false, message: "Ticker item not found." }, { status: 404 });
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: "Invalid request data." }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to complete the request." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.tickerItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Ticker item deleted successfully." });
  } catch (error) {
    logDatabaseError("admin.ticker.delete", error);
    if (prismaErrorCode(error) === "P2025") return NextResponse.json({ success: false, message: "Ticker item not found." }, { status: 404 });
    return NextResponse.json({ success: false, message: "Unable to complete the request." }, { status: 500 });
  }
}
