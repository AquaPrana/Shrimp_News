import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { validatePrismaArticleInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    return NextResponse.json({ article });
  } catch (error) {
    logDatabaseError("articles.get", error);
    return NextResponse.json({ error: "Failed to load article." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const validated = validatePrismaArticleInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const duplicate = await prisma.article.findFirst({
      where: { slug: validated.value.slug, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Another article already uses this slug." }, { status: 409 });
    }

    const article = await prisma.article.update({
      where: { id },
      data: validated.value,
    });
    return NextResponse.json({ message: "Article updated successfully.", article });
  } catch (error) {
    logDatabaseError("articles.update", error);
    const code = prismaErrorCode(error);
    if (code === "P2002") {
      return NextResponse.json({ error: "Another article already uses this slug." }, { status: 409 });
    }
    if (code === "P2025") return NextResponse.json({ error: "Article not found." }, { status: 404 });
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update article." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ message: "Article deleted successfully." });
  } catch (error) {
    logDatabaseError("articles.delete", error);
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete article." }, { status: 500 });
  }
}
