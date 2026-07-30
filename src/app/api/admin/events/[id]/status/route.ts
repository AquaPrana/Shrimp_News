import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { EVENT_STATUSES } from "@/lib/event-validation";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json() as { status?: unknown };
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
      return NextResponse.json({ error: "Choose a valid event status." }, { status: 400 });
    }
    const event = await prisma.event.update({ where: { id }, data: { status } });
    return NextResponse.json({ message: `Event ${status}.`, event });
  } catch (error) {
    logDatabaseError("admin.events.status", error);
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update event status." }, { status: 500 });
  }
}
