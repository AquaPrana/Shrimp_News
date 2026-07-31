import { NextResponse } from "next/server";
import { isValidUnsubscribeToken } from "@/lib/newsletter/tokens";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(`newsletter:unsubscribe:${clientIp(request)}`, 20, 60 * 60_000)) {
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMITED",
        message: "Unable to unsubscribe right now. Please try again.",
      },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token =
      typeof body.token === "string" ? body.token.trim().toLowerCase() : "";
    if (!isValidUnsubscribeToken(token)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TOKEN",
          message: "This unsubscribe link is invalid.",
        },
        { status: 400 },
      );
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, isActive: true },
    });
    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TOKEN",
          message: "This unsubscribe link is invalid.",
        },
        { status: 400 },
      );
    }
    if (!subscriber.isActive) {
      return NextResponse.json({
        success: true,
        code: "ALREADY_UNSUBSCRIBED",
        message: "This subscription is already inactive.",
      });
    }

    const update = await prisma.subscriber.updateMany({
      where: { id: subscriber.id, isActive: true },
      data: { isActive: false },
    });
    return NextResponse.json({
      success: true,
      code: update.count ? "UNSUBSCRIBED" : "ALREADY_UNSUBSCRIBED",
      message: update.count
        ? "You have successfully unsubscribed from Shrimp.News emails."
        : "This subscription is already inactive.",
    });
  } catch (error) {
    logDatabaseError("newsletter.unsubscribe", error);
    return NextResponse.json(
      {
        success: false,
        code: "UNSUBSCRIBE_FAILED",
        message: "Unable to unsubscribe right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
