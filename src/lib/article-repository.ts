import "server-only";
import type { RowDataPacket } from "mysql2";
import {
  resolveArticleTaxonomy,
  type PublicArticle,
  type Subscriber,
} from "@/lib/article-types";

export type ArticleRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  main_category?: string | null;
  category: string;
  language: PublicArticle["language"];
  author: string | null;
  status: PublicArticle["status"];
  seo_title: string | null;
  seo_description: string | null;
  source_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  published_at: Date | string | null;
};

export function mapArticle(row: ArticleRow): PublicArticle {
  const taxonomy = resolveArticleTaxonomy({
    mainCategory: row.main_category,
    category: row.category,
  });
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt || row.title,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    language: row.language,
    author: row.author || "Shrimp.News Editorial",
    status: row.status,
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.excerpt || "",
    sourceUrl: row.source_url,
    topics: [],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
  };
}

export type SubscriberRow = RowDataPacket & {
  id: number;
  name: string | null;
  email: string;
  language: Subscriber["language"];
  status: Subscriber["status"];
  subscribed_at: Date | string;
};

export function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    language: row.language,
    status: row.status,
    subscribedAt: new Date(row.subscribed_at).toISOString(),
  };
}
