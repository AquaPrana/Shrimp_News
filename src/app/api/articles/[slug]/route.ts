import { NextResponse } from "next/server";
import { ARTICLE_LANGUAGES, type ArticleLanguage } from "@/lib/article-types";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { localizedSlug, mapPublicArticle } from "@/lib/public-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const requestedLanguage = new URL(request.url).searchParams.get("language") as ArticleLanguage | null;
    const language = requestedLanguage && ARTICLE_LANGUAGES.includes(requestedLanguage)
      ? requestedLanguage
      : null;
    const requestedSlug = language ? localizedSlug(slug, language) : slug;
    const article = await prisma.article.findFirst({
      where: { slug: requestedSlug, isPublished: true },
    });

    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const related = await prisma.article.findMany({
      where: {
        id: { not: article.id },
        isPublished: true,
        language: article.language,
        category: article.category,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    return NextResponse.json({
      article: mapPublicArticle(article),
      related: related.map(mapPublicArticle),
    });
  } catch (error) {
    logDatabaseError("public-articles.get", error);
    return NextResponse.json({ error: "Unable to load this article." }, { status: 500 });
  }
}
