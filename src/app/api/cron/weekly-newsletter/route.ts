import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/newsletter/cron-authorization";
import {
  getCronSecret,
  NewsletterConfigurationError,
} from "@/lib/newsletter/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Weekly newsletter email delivery is temporarily disabled.
 * This route remains available for auth checks but does not send email.
 */
export async function GET(request: Request) {
  let expectedSecret: string;
  try {
    expectedSecret = getCronSecret();
  } catch (error) {
    const variable =
      error instanceof NewsletterConfigurationError ? error.variable : "CRON_SECRET";
    console.error("[newsletter:cron-configuration]", { variable });
    return NextResponse.json(
      {
        success: false,
        code: "CONFIGURATION_ERROR",
        message: `Missing or invalid server configuration: ${variable}.`,
      },
      { status: 500 },
    );
  }

  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      expectedSecret,
    )
  ) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Unauthorized." },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      code: "NEWSLETTER_EMAIL_DISABLED",
      message:
        "Weekly newsletter email delivery is temporarily disabled. No emails were sent.",
    },
    { status: 503 },
  );
}
