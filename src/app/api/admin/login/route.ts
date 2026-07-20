import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, getAdminCredentials } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(`admin-login:${clientIp(request)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const plainPassword = body.password || "";
    const credentials = getAdminCredentials();
    if (!credentials) return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });

    const validPassword = isEmail(email) && plainPassword.length <= 200
      ? await compare(plainPassword, credentials.passwordHash)
      : false;
    if (email !== credentials.admin.email || !validPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createAdminToken(credentials.admin);
    (await cookies()).set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return NextResponse.json({ message: "Signed in." });
  } catch {
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
