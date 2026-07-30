import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "shrimp_admin_session";
export const ADMIN_ROLES = ["super_admin", "editor", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  imageUrl: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  sessionId: string | null;
  sessionCreatedAt: string | null;
  sessionExpiresAt: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  isLegacy: boolean;
};

export type AdminCredentials = {
  admin: AdminSession;
  passwordHash: string;
};

function normalizeRole(role: string | null | undefined): AdminRole {
  if (role === "editor" || role === "viewer") return role;
  return "super_admin";
}

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!email || !passwordHash) return null;
  return {
    admin: {
      id: "legacy-env-admin",
      name: process.env.ADMIN_NAME?.trim() || "Shrimp.News Admin",
      email,
      role: "super_admin",
      imageUrl: null,
      createdAt: null,
      lastLoginAt: null,
      sessionId: null,
      sessionCreatedAt: null,
      sessionExpiresAt: null,
      userAgent: null,
      ipAddress: null,
      isLegacy: true,
    },
    passwordHash,
  };
}

const developmentSecret = new TextEncoder().encode(
  "shrimp-news-development-session-secret-change-before-production",
);

function sessionSecret() {
  const value =
    process.env.AUTH_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim();
  if (value) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV !== "production") return developmentSecret;
  throw new Error("Admin session secret is not configured.");
}

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminToken(
  admin: Pick<AdminSession, "id" | "name" | "email" | "role">,
  options?: { sessionId?: string | null; maxAgeSeconds?: number; legacy?: boolean },
) {
  const maxAgeSeconds = options?.maxAgeSeconds ?? 60 * 60 * 8;
  const token = new SignJWT({
    name: admin.name,
    email: admin.email,
    role: admin.role,
    sid: options?.sessionId || undefined,
    legacy: options?.legacy === true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds);
  return token.sign(sessionSecret());
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
    });
    const adminId = typeof payload.sub === "string" ? payload.sub : "";
    const sessionId = typeof payload.sid === "string" ? payload.sid : "";

    if (adminId && sessionId) {
      try {
        const record = await prisma.adminSessionRecord.findFirst({
          where: {
            id: sessionId,
            adminId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            admin: { isActive: true },
          },
          include: { admin: true },
        });
        if (!record) return null;
        return {
          id: record.admin.id,
          name: record.admin.name,
          email: record.admin.email,
          role: normalizeRole(record.admin.role),
          imageUrl: record.admin.imageUrl,
          createdAt: record.admin.createdAt.toISOString(),
          lastLoginAt: record.admin.lastLoginAt?.toISOString() || null,
          sessionId: record.id,
          sessionCreatedAt: record.createdAt.toISOString(),
          sessionExpiresAt: record.expiresAt.toISOString(),
          userAgent: record.userAgent,
          ipAddress: record.ipAddress,
          isLegacy: false,
        };
      } catch (error) {
        logDatabaseError("admin.session.read", error);
        return null;
      }
    }

    if (payload.legacy === true) {
      const credentials = getAdminCredentials();
      if (
        credentials &&
        payload.email === credentials.admin.email &&
        adminId === credentials.admin.id
      ) {
        return credentials.admin;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await readAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function verifyAdminApi(request: Request) {
  const admin = await readAdminSession();
  if (!admin) return null;
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    try {
      if (origin && host && new URL(origin).host !== host) return null;
    } catch {
      return null;
    }
  }
  return admin;
}
