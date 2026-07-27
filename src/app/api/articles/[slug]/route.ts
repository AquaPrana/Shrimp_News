import { NextResponse } from "next/server";
import { logDatabaseError } from "@/lib/prisma";
import {
  baseSlug,
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from "@/lib/public-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(baseSlug(slug));
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const related = await getRelatedPublishedArticles(article, 3);

    return NextResponse.json({
      article,
      related,
    });
  } catch (error) {
    logDatabaseError("public-articles.get", error);
    return NextResponse.json(
      { error: "Unable to load this article." },
      { status: 500 },
    );
  }
}
