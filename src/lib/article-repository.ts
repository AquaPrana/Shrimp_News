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
  title_en?: string | null;
  summary_en?: string | null;
  content_en?: string | null;
  title_te?: string | null;
  summary_te?: string | null;
  content_te?: string | null;
  title_hi?: string | null;
  summary_hi?: string | null;
  content_hi?: string | null;
};

export function mapArticle(row: ArticleRow): PublicArticle {
  const taxonomy = resolveArticleTaxonomy({
    mainCategory: row.main_category,
    category: row.category,
  });
  const titleEn = row.title_en?.trim() || row.title;
  const summaryEn = row.summary_en?.trim() || row.excerpt || "";
  const contentEn = row.content_en?.trim() || row.content;
  const titleTe = row.title_te?.trim() || "";
  const summaryTe = row.summary_te?.trim() || "";
  const contentTe = row.content_te?.trim() || "";
  const titleHi = row.title_hi?.trim() || "";
  const summaryHi = row.summary_hi?.trim() || "";
  const contentHi = row.content_hi?.trim() || "";
  return {
    id: String(row.id),
    title: titleEn,
    slug: row.slug,
    excerpt: summaryEn,
    content: contentEn,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt || titleEn,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    language: row.language,
    author: row.author || "Shrimp News Editorial",
    status: row.status,
    seoTitle: row.seo_title || titleEn,
    seoDescription: row.seo_description || summaryEn,
    sourceUrl: row.source_url,
    topics: [],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
    titleEn,
    summaryEn,
    contentEn,
    titleTe,
    summaryTe,
    contentTe,
    titleHi,
    summaryHi,
    contentHi,
    translationAvailable: {
      en: Boolean(titleEn && contentEn),
      te: Boolean(titleTe && contentTe),
      hi: Boolean(titleHi && contentHi),
    },
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
