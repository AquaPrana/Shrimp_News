import { NextResponse } from "next/server";
import { parseNewsletterEmail } from "@/lib/newsletter/email-validation";
import { subscribeEmail } from "@/lib/newsletter/subscription";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logRouteError, prismaErrorCode } from "@/lib/prisma";

export const runtime = "nodejs";

const INVALID_EMAIL = "Please enter a valid email address.";
const GENERAL_FAILURE = "Unable to subscribe right now. Please try again.";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`newsletter:ip:${ip}`, 8, 15 * 60_000)) {
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMITED",
        message: GENERAL_FAILURE,
      },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseNewsletterEmail(body.email);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_EMAIL",
          message: INVALID_EMAIL,
        },
        { status: 400 },
      );
    }

    if (!rateLimit(`newsletter:email:${parsed.email}`, 4, 15 * 60_000)) {
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMITED",
          message: GENERAL_FAILURE,
        },
        { status: 429 },
      );
    }

    const result = await subscribeEmail(parsed.email);
    return NextResponse.json(
      {
        success: true,
        code: result.kind.toUpperCase(),
        message: result.message,
      },
      { status: result.status },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: INVALID_EMAIL,
        },
        { status: 400 },
      );
    }

    const prismaCode = prismaErrorCode(error);
    const status = prismaCode === "P2022" ? 503 : 500;
    logRouteError("POST /api/subscribe", error, status);
    return NextResponse.json(
      {
        success: false,
        code:
          prismaCode === "P2022"
            ? "DATABASE_SCHEMA_OUT_OF_DATE"
            : "SUBSCRIPTION_FAILED",
        message: GENERAL_FAILURE,
      },
      { status },
    );
  }
}
