import { NextResponse } from "next/server";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(`newsletter:${clientIp(request)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const existing = await prisma.subscriber.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });

    await prisma.subscriber.create({ data: { email } });
    return NextResponse.json({ message: "Subscription confirmed." }, { status: 201 });
  } catch (error) {
    logDatabaseError("subscribers.create", error);
    if (prismaErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 500 });
  }
}
