import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { isEmail, normalizeArticleImageUrl, sanitizePlainText } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await verifyAdminApi(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ admin });
}

export async function PUT(request: Request) {
  const session = await verifyAdminApi(request);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.isLegacy) {
    return NextResponse.json(
      { error: "Deploy the additive admin migration before editing this profile." },
      { status: 409 },
    );
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = sanitizePlainText(body.name, 120);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const image = normalizeArticleImageUrl(body.imageUrl);
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });

    const admin = await prisma.admin.update({
      where: { id: session.id },
      data: { name, email, imageUrl: image.value },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return NextResponse.json({ message: "Profile updated successfully.", admin });
  } catch (error) {
    logDatabaseError("admin.profile.update", error);
    if (prismaErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
