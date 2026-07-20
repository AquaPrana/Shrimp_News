import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";
import { createDemoArticle, demoStore } from "@/lib/demo-admin-store";
import { mapArticle, type ArticleRow } from "@/lib/article-repository";
import { execute, isMysqlIntegrationEnabled, selectRows } from "@/lib/mysql";
import { validateArticleInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase();
  const category = url.searchParams.get("category");
  const language = url.searchParams.get("language");
  const status = url.searchParams.get("status");
  const date = url.searchParams.get("date");

  if (!isMysqlIntegrationEnabled()) {
    const articles = demoStore.articles.filter((article) =>
      (!q || article.title.toLowerCase().includes(q)) &&
      (!category || article.category === category) &&
      (!language || article.language === language) &&
      (!status || article.status === status) &&
      (!date || article.publishedAt?.slice(0, 10) === date),
    ).sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt));
    return NextResponse.json({ articles });
  }

  try {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (q) { clauses.push("title LIKE ?"); values.push(`%${q}%`); }
    if (category) { clauses.push("category=?"); values.push(category); }
    if (language) { clauses.push("language=?"); values.push(language); }
    if (status) { clauses.push("status=?"); values.push(status); }
    if (date) { clauses.push("DATE(published_at)=?"); values.push(date); }
    const rows = await selectRows<ArticleRow>(`SELECT * FROM articles ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY COALESCE(published_at,created_at) DESC LIMIT 500`, values);
    return NextResponse.json({ articles: rows.map(mapArticle) });
  } catch { return NextResponse.json({ error: "Unable to load articles." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const parsed = validateArticleInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const article = parsed.value;
    if (!isMysqlIntegrationEnabled()) {
      if (demoStore.articles.some((item) => item.slug === article.slug)) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
      const created = createDemoArticle(article);
      return NextResponse.json({ id: created.id, message: article.status === "published" ? "Article published." : "Draft saved." }, { status: 201 });
    }
    const duplicate = await selectRows<ArticleRow>("SELECT id FROM articles WHERE slug=? LIMIT 1", [article.slug]);
    if (duplicate[0]) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    const publishedAt = article.status === "published" ? article.publishedAt || new Date().toISOString().slice(0, 19).replace("T", " ") : article.publishedAt;
    const result = await execute("INSERT INTO articles (title,slug,excerpt,content,featured_image_url,featured_image_alt,category,language,author,status,seo_title,seo_description,source_url,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [article.title, article.slug, article.excerpt, article.content, article.featuredImageUrl, article.featuredImageAlt, article.category, article.language, article.author, article.status, article.seoTitle, article.seoDescription, article.sourceUrl, publishedAt]);
    return NextResponse.json({ id: result.insertId, message: article.status === "published" ? "Article published." : "Draft saved." }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to save the article." }, { status: 500 }); }
}
