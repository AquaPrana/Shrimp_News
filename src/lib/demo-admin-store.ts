import "server-only";

import { launchArticles, getArticleCover } from "@/data/articles";
import type { PublicArticle, Subscriber } from "@/lib/article-types";
import type { ArticleInput } from "@/lib/validation";

type DemoStore = {
  articles: PublicArticle[];
  subscribers: Subscriber[];
  nextArticleId: number;
};

const globalDemo = globalThis as typeof globalThis & { shrimpNewsDemoStore?: DemoStore };

function createStore(): DemoStore {
  const base = Date.UTC(2026, 6, 20, 5, 30);
  return {
    articles: launchArticles.map((article, index) => {
      const timestamp = new Date(base - index * 86_400_000).toISOString();
      return {
        id: `demo-${index + 1}`,
        title: article.title.en,
        slug: article.slug,
        excerpt: article.excerpt.en,
        content: article.body.en,
        featuredImageUrl: getArticleCover(article.slug) ?? null,
        featuredImageAlt: article.title.en,
        category: article.category.en as PublicArticle["category"],
        language: "en",
        author: "Shrimp.News Editorial",
        status: "published",
        seoTitle: article.title.en,
        seoDescription: article.excerpt.en,
        sourceUrl: null,
        topics: article.topics,
        createdAt: timestamp,
        updatedAt: timestamp,
        publishedAt: timestamp,
      };
    }),
    subscribers: [
      { id: "demo-sub-1", name: "Ravi Kumar", email: "ravi@example.com", language: "en", status: "active", subscribedAt: "2026-07-20T08:30:00.000Z" },
      { id: "demo-sub-2", name: "Sita Rao", email: "sita@example.com", language: "te", status: "active", subscribedAt: "2026-07-19T09:15:00.000Z" },
    ],
    nextArticleId: launchArticles.length + 1,
  };
}

export const demoStore = globalDemo.shrimpNewsDemoStore ?? createStore();
globalDemo.shrimpNewsDemoStore = demoStore;

export function createDemoArticle(input: ArticleInput) {
  const now = new Date().toISOString();
  const article: PublicArticle = {
    id: `demo-${demoStore.nextArticleId++}`,
    ...input,
    topics: [],
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === "published" ? input.publishedAt ?? now : input.publishedAt,
  };
  demoStore.articles.unshift(article);
  return article;
}

export function updateDemoArticle(id: string, input: ArticleInput) {
  const index = demoStore.articles.findIndex((article) => article.id === id);
  if (index < 0) return null;
  const existing = demoStore.articles[index];
  const publishedAt = input.status === "published"
    ? input.publishedAt ?? existing.publishedAt ?? new Date().toISOString()
    : input.publishedAt ?? existing.publishedAt;
  demoStore.articles[index] = { ...existing, ...input, publishedAt, updatedAt: new Date().toISOString() };
  return demoStore.articles[index];
}
