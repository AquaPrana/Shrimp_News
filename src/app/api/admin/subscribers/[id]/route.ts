import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: "active" | "unsubscribed" };
  if (!body.status || !["active", "unsubscribed"].includes(body.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  try {
    const result = await prisma.subscriber.updateMany({
      where: { id },
      data: { isActive: body.status === "active" },
    });
    return result.count
      ? NextResponse.json({ message: "Subscriber updated." })
      : NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  } catch (error) {
    logDatabaseError("subscribers.update", error);
    return NextResponse.json({ error: "Unable to update subscriber." }, { status: 500 });
  }
}
