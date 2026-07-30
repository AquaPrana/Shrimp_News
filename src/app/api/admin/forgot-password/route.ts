import { NextResponse } from "next/server";
import { createResetToken, deliverPasswordReset, hashResetToken } from "@/lib/admin-security";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const GENERIC_MESSAGE = "If an administrator account matches that email, reset instructions will be sent.";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin-forgot:${ip}`, 5, 30 * 60_000)) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
  let email = "";
  try {
    const body = await request.json() as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
  if (!isEmail(email)) return NextResponse.json({ message: GENERIC_MESSAGE });

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin?.isActive) {
      const token = createResetToken();
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60_000);
      await prisma.$transaction([
        prisma.adminPasswordReset.updateMany({
          where: { adminId: admin.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.adminPasswordReset.create({
          data: { adminId: admin.id, tokenHash, expiresAt },
        }),
      ]);
      const resetUrl = new URL("/admin/reset-password", request.url);
      resetUrl.searchParams.set("token", token);
      await deliverPasswordReset(admin.email, resetUrl.toString());
    }
  } catch (error) {
    logDatabaseError("admin.password.forgot", error);
  }
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
