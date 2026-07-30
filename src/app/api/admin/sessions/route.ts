import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await verifyAdminApi(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.isLegacy) return NextResponse.json({ sessions: [], legacy: true });
  try {
    const [sessions, history] = await Promise.all([
      prisma.adminSessionRecord.findMany({
        where: {
          adminId: admin.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastSeenAt: "desc" },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          rememberMe: true,
          expiresAt: true,
          lastSeenAt: true,
          createdAt: true,
        },
      }),
      prisma.adminLoginAudit.findMany({
        where: { adminId: admin.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          success: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
    ]);
    return NextResponse.json({
      sessions: sessions.map((session) => ({
        ...session,
        isCurrent: session.id === admin.sessionId,
      })),
      history,
      legacy: false,
    });
  } catch (error) {
    logDatabaseError("admin.sessions.list", error);
    return NextResponse.json({ error: "Unable to load session information." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdminApi(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.isLegacy || !admin.sessionId) {
    return NextResponse.json({ error: "Database-backed sessions are not active yet." }, { status: 409 });
  }
  try {
    const result = await prisma.adminSessionRecord.updateMany({
      where: {
        adminId: admin.id,
        id: { not: admin.sessionId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({
      message: `${result.count} other session${result.count === 1 ? "" : "s"} signed out.`,
    });
  } catch (error) {
    logDatabaseError("admin.sessions.revoke", error);
    return NextResponse.json({ error: "Unable to sign out other devices." }, { status: 500 });
  }
}
