import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { validateEventInput } from "@/lib/event-validation";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ event });
  } catch (error) {
    logDatabaseError("admin.events.get", error);
    return NextResponse.json({ error: "Failed to load event." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const validated = validateEventInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const duplicate = await prisma.event.findFirst({
      where: { slug: validated.value.slug, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Another event already uses this slug." }, { status: 409 });
    }
    const event = await prisma.event.update({
      where: { id },
      data: validated.value,
    });
    return NextResponse.json({ message: "Event updated successfully.", event });
  } catch (error) {
    logDatabaseError("admin.events.update", error);
    const code = prismaErrorCode(error);
    if (code === "P2002") {
      return NextResponse.json({ error: "Another event already uses this slug." }, { status: 409 });
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Event deleted successfully." });
  } catch (error) {
    logDatabaseError("admin.events.delete", error);
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });
  }
}
