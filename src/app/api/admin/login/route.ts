import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminToken,
  getAdminCredentials,
} from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { isEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safeCompare(password: string, hash: string) {
  if (!password || password.length > 200) return false;
  try {
    return await compare(password, hash);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ipAddress = clientIp(request);
  if (!rateLimit(`admin-login:${ipAddress}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: { email?: unknown; password?: unknown; rememberMe?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rememberMe = body.rememberMe === true;
  const userAgent = request.headers.get("user-agent")?.slice(0, 1000) || null;
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const legacy = getAdminCredentials();
  let databaseAvailable = true;
  let admin = null as Awaited<ReturnType<typeof prisma.admin.findUnique>>;

  try {
    admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin && legacy?.admin.email === email) {
      const matches = await safeCompare(password, legacy.passwordHash);
      if (matches) {
        admin = await prisma.admin.create({
          data: {
            name: legacy.admin.name,
            email,
            password: legacy.passwordHash,
            role: "super_admin",
          },
        });
      }
    }
  } catch (error) {
    databaseAvailable = false;
    logDatabaseError("admin.login.database", error);
  }

  if (!databaseAvailable) {
    const matches = Boolean(
      legacy &&
      legacy.admin.email === email &&
      await safeCompare(password, legacy.passwordHash),
    );
    if (!matches || !legacy) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
    const token = await createAdminToken(legacy.admin, {
      maxAgeSeconds: maxAge,
      legacy: true,
    });
    const response = NextResponse.json({ success: true, redirectTo: "/admin" });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(maxAge));
    return response;
  }

  const passwordMatches = Boolean(
    admin &&
    admin.isActive &&
    await safeCompare(password, admin.password),
  );

  if (!passwordMatches || !admin) {
    try {
      await prisma.adminLoginAudit.create({
        data: {
          adminId: admin?.id || null,
          email,
          success: false,
          userAgent,
          ipAddress,
        },
      });
    } catch {
      // Login responses remain generic even if audit storage is unavailable.
    }
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAge * 1000);
  try {
    const session = await prisma.adminSessionRecord.create({
      data: {
        adminId: admin.id,
        userAgent,
        ipAddress,
        rememberMe,
        expiresAt,
      },
    });
    await Promise.all([
      prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: now },
      }),
      prisma.adminLoginAudit.create({
        data: {
          adminId: admin.id,
          email,
          success: true,
          userAgent,
          ipAddress,
        },
      }),
    ]);
    const token = await createAdminToken(
      {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role === "editor" || admin.role === "viewer"
          ? admin.role
          : "super_admin",
      },
      { sessionId: session.id, maxAgeSeconds: maxAge },
    );
    const response = NextResponse.json({ success: true, redirectTo: "/admin" });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(maxAge));
    return response;
  } catch (error) {
    logDatabaseError("admin.login.session", error);
    return NextResponse.json({ error: "Unable to create a secure session." }, { status: 500 });
  }
}
