import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { validatePassword } from "@/lib/password-policy";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await verifyAdminApi(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-password:${admin.id}:${clientIp(request)}`, 5, 30 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  if (admin.isLegacy || !admin.sessionId) {
    return NextResponse.json(
      { error: "Deploy the additive admin migration before changing the password." },
      { status: 409 },
    );
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    const policyError = validatePassword(newPassword);
    if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
    }
    const record = await prisma.admin.findUnique({ where: { id: admin.id } });
    if (!record || !await compare(currentPassword, record.password)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (await compare(newPassword, record.password)) {
      return NextResponse.json({ error: "Choose a password you have not just used." }, { status: 400 });
    }
    const password = await hash(newPassword, 12);
    await prisma.$transaction([
      prisma.admin.update({ where: { id: admin.id }, data: { password } }),
      prisma.adminSessionRecord.updateMany({
        where: { adminId: admin.id, id: { not: admin.sessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return NextResponse.json({
      message: "Password changed successfully. Other devices have been signed out.",
    });
  } catch (error) {
    logDatabaseError("admin.password.change", error);
    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}
