import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { hashResetToken } from "@/lib/admin-security";
import { validatePassword } from "@/lib/password-policy";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`admin-reset:${clientIp(request)}`, 8, 30 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    const policyError = validatePassword(newPassword);
    if (!token) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
    }
    const reset = await prisma.adminPasswordReset.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }
    const password = await hash(newPassword, 12);
    const now = new Date();
    await prisma.$transaction([
      prisma.admin.update({ where: { id: reset.adminId }, data: { password } }),
      prisma.adminPasswordReset.update({ where: { id: reset.id }, data: { usedAt: now } }),
      prisma.adminSessionRecord.updateMany({
        where: { adminId: reset.adminId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    return NextResponse.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    logDatabaseError("admin.password.reset", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
