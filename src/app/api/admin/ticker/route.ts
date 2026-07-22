import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { ensureTickerMeta, validateTickerItemInput } from "@/lib/ticker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const meta = await ensureTickerMeta();
    const items = await prisma.tickerItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({
      items,
      lastUpdated: meta.lastUpdated.toISOString(),
    });
  } catch (error) {
    logDatabaseError("admin.ticker.list", error);
    return NextResponse.json({ error: "Failed to load ticker items." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    if (body.action === "updateLastUpdated") {
      const raw =
        typeof body.lastUpdated === "string" ? body.lastUpdated.trim() : "";
      const lastUpdated = raw ? new Date(raw) : null;
      if (!lastUpdated || Number.isNaN(lastUpdated.getTime())) {
        return NextResponse.json(
          { error: "A valid last updated date and time is required." },
          { status: 400 },
        );
      }

      const meta = await prisma.tickerMeta.upsert({
        where: { id: "default" },
        create: { id: "default", lastUpdated },
        update: { lastUpdated },
      });

      return NextResponse.json({
        message: "Last updated time saved.",
        lastUpdated: meta.lastUpdated.toISOString(),
      });
    }

    const validated = validateTickerItemInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    await ensureTickerMeta();
    const count = await prisma.tickerItem.count();
    const item = await prisma.tickerItem.create({
      data: {
        ...validated.value,
        sortOrder:
          validated.value.sortOrder || count,
      },
    });

    return NextResponse.json(
      { message: "Ticker item created.", item },
      { status: 201 },
    );
  } catch (error) {
    logDatabaseError("admin.ticker.create", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create ticker item." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Ticker item id is required." }, { status: 400 });
    }

    const validated = validateTickerItemInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const item = await prisma.tickerItem.update({
      where: { id },
      data: validated.value,
    });

    return NextResponse.json({ message: "Ticker item updated.", item });
  } catch (error) {
    logDatabaseError("admin.ticker.update", error);
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Ticker item not found." }, { status: 404 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update ticker item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Ticker item id is required." }, { status: 400 });
    }

    await prisma.tickerItem.delete({ where: { id } });
    return NextResponse.json({ message: "Ticker item deleted." });
  } catch (error) {
    logDatabaseError("admin.ticker.delete", error);
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Ticker item not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete ticker item." }, { status: 500 });
  }
}
