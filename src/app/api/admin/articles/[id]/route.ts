import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { demoStore, updateDemoArticle } from "@/lib/demo-admin-store";
import { mapArticle, type ArticleRow } from "@/lib/article-repository";
import { execute, isMysqlIntegrationEnabled, selectRows } from "@/lib/mysql";
import { validateArticleInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  if (!isMysqlIntegrationEnabled()) {
    const article = demoStore.articles.find((item) => item.id === id);
    return article ? NextResponse.json({ article }) : NextResponse.json({ error: "Article not found." }, { status: 404 });
  }
  try {
    const rows = await selectRows<ArticleRow>("SELECT * FROM articles WHERE id=? LIMIT 1", [id]);
    return rows[0] ? NextResponse.json({ article: mapArticle(rows[0]) }) : NextResponse.json({ error: "Article not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Unable to load the article." }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const parsed = validateArticleInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const article = parsed.value;
    if (!isMysqlIntegrationEnabled()) {
      if (demoStore.articles.some((item) => item.slug === article.slug && item.id !== id)) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
      const updated = updateDemoArticle(id, article);
      return updated ? NextResponse.json({ message: article.status === "published" ? "Article updated and published." : "Draft updated." }) : NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    const existing = await selectRows<ArticleRow>("SELECT * FROM articles WHERE id=? LIMIT 1", [id]);
    if (!existing[0]) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    const duplicate = await selectRows<ArticleRow>("SELECT id FROM articles WHERE slug=? AND id<>? LIMIT 1", [article.slug, id]);
    if (duplicate[0]) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    let publishedAt = article.publishedAt || (existing[0].published_at ? new Date(existing[0].published_at).toISOString().slice(0, 19).replace("T", " ") : null);
    if (article.status === "published" && !publishedAt) publishedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    await execute("UPDATE articles SET title=?,slug=?,excerpt=?,content=?,featured_image_url=?,featured_image_alt=?,category=?,language=?,author=?,status=?,seo_title=?,seo_description=?,source_url=?,published_at=? WHERE id=?", [article.title, article.slug, article.excerpt, article.content, article.featuredImageUrl, article.featuredImageAlt, article.category, article.language, article.author, article.status, article.seoTitle, article.seoDescription, article.sourceUrl, publishedAt, id]);
    return NextResponse.json({ message: article.status === "published" ? "Article updated and published." : "Draft updated." });
  } catch { return NextResponse.json({ error: "Unable to update the article." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  if (!isMysqlIntegrationEnabled()) {
    const index = demoStore.articles.findIndex((item) => item.id === id);
    if (index < 0) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    demoStore.articles.splice(index, 1);
    return NextResponse.json({ message: "Article deleted." });
  }
  try {
    const result = await execute("DELETE FROM articles WHERE id=?", [id]);
    return result.affectedRows ? NextResponse.json({ message: "Article deleted." }) : NextResponse.json({ error: "Article not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Unable to delete the article." }, { status: 500 }); }
}
