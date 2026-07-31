import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import {
  logRouteError,
  prisma,
  prismaErrorCode,
} from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase();
    const rows = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 2_000,
      select: {
        id: true,
        email: true,
        isActive: true,
        subscribedAt: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    const subscribers = q
      ? rows.filter((subscriber) => subscriber.email.toLowerCase().includes(q))
      : rows;
    return NextResponse.json({ subscribers, total: subscribers.length });
  } catch (error) {
    const prismaCode = prismaErrorCode(error);
    const status = prismaCode === "P2022" ? 503 : 500;
    logRouteError("GET /api/admin/subscribers", error, status);
    return NextResponse.json(
      {
        success: false,
        code:
          prismaCode === "P2022"
            ? "DATABASE_SCHEMA_OUT_OF_DATE"
            : "SUBSCRIBER_LOAD_FAILED",
        error: "Unable to load subscribers.",
      },
      { status },
    );
  }
}
