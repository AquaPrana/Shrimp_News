import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { verifyAdminApi } from "@/lib/admin-auth";
import { validateEventInput } from "@/lib/event-validation";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const region = url.searchParams.get("region")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const featured = url.searchParams.get("featured")?.trim();
    const date = url.searchParams.get("date")?.trim();
    const where: Prisma.EventWhereInput = {};

    if (search) where.title = { contains: search };
    if (region) where.region = region;
    if (category) where.category = category;
    if (status) where.status = status;
    if (featured === "true" || featured === "false") {
      where.isFeatured = featured === "true";
    }
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        where.startDate = { gte: start, lt: end };
      }
    }

    const [events, categories] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.event.findMany({
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
    ]);
    return NextResponse.json({
      events,
      categories: categories.map((row) => row.category),
    });
  } catch (error) {
    logDatabaseError("admin.events.list", error);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const validated = validateEventInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const duplicate = await prisma.event.findUnique({
      where: { slug: validated.value.slug },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "An event with this slug already exists." }, { status: 409 });
    }
    const event = await prisma.event.create({ data: validated.value });
    return NextResponse.json({ message: "Event created successfully.", event }, { status: 201 });
  } catch (error) {
    logDatabaseError("admin.events.create", error);
    if (prismaErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "An event with this slug already exists." }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
