import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { syncArticleTranslations } from "@/lib/article-translations-sync";
import { resolveArticleTaxonomy } from "@/lib/article-types";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    if (article.language !== "en") {
      return NextResponse.json(
        { error: "Retry translation from the English source article." },
        { status: 400 },
      );
    }

    const taxonomy = resolveArticleTaxonomy({
      mainCategory: article.mainCategory,
      category: article.category,
    });
    const result = await syncArticleTranslations(id, {
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      imageUrl: article.imageUrl,
      mainCategory: taxonomy.mainCategory,
      category: taxonomy.category,
      language: "en",
      isPublished: true,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      message: "Telugu and Hindi translations are available and published.",
    });
  } catch (error) {
    logDatabaseError("articles.retry-translation", error);
    return NextResponse.json(
      { error: "Unable to retry translation right now." },
      { status: 500 },
    );
  }
}
