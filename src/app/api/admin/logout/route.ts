import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminApi } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await verifyAdminApi(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (admin.sessionId) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.adminSessionRecord.updateMany({
        where: { id: admin.sessionId, adminId: admin.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Cookie deletion still signs the current browser out.
    }
  }
  (await cookies()).set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ message: "Signed out." });
}
