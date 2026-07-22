import "server-only";

import { launchArticles, getArticleCover } from "@/data/articles";
import {
  resolveArticleTaxonomy,
  type PublicArticle,
  type Subscriber,
} from "@/lib/article-types";
import type { ArticleInput } from "@/lib/validation";

type DemoStore = {
  articles: PublicArticle[];
  subscribers: Subscriber[];
  nextArticleId: number;
};

const globalDemo = globalThis as typeof globalThis & {
  shrimpNewsDemoStore?: DemoStore;
};

function createStore(): DemoStore {
  const base = Date.UTC(2026, 6, 20, 5, 30);
  return {
    articles: launchArticles.map((article, index) => {
      const timestamp = new Date(base - index * 86_400_000).toISOString();
      const isGlobal = article.topics.includes("international");
      const taxonomy = resolveArticleTaxonomy({
        mainCategory: isGlobal ? "Global" : "India",
        category: article.category.en,
      });
      return {
        id: `demo-${index + 1}`,
        title: article.title.en,
        slug: article.slug,
        excerpt: article.excerpt.en,
        content: article.body.en,
        featuredImageUrl: getArticleCover(article.slug) ?? null,
        featuredImageAlt: article.title.en,
        mainCategory: taxonomy.mainCategory,
        category: taxonomy.category,
        language: "en" as const,
        author: "Shrimp.News Editorial",
        status: "published" as const,
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
      {
        id: "demo-sub-1",
        name: "Ravi Kumar",
        email: "ravi@example.com",
        language: "en",
        status: "active",
        subscribedAt: "2026-07-20T08:30:00.000Z",
      },
      {
        id: "demo-sub-2",
        name: "Sita Rao",
        email: "sita@example.com",
        language: "te",
        status: "active",
        subscribedAt: "2026-07-19T09:15:00.000Z",
      },
    ],
    nextArticleId: launchArticles.length + 1,
  };
}

export const demoStore = globalDemo.shrimpNewsDemoStore ?? createStore();
globalDemo.shrimpNewsDemoStore = demoStore;

export function createDemoArticle(input: ArticleInput) {
  const now = new Date().toISOString();
  const taxonomy = resolveArticleTaxonomy({
    category: input.category,
  });
  const article: PublicArticle = {
    id: `demo-${demoStore.nextArticleId++}`,
    ...input,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    topics: [],
    createdAt: now,
    updatedAt: now,
    publishedAt:
      input.status === "published"
        ? input.publishedAt ?? now
        : input.publishedAt,
  };
  demoStore.articles.unshift(article);
  return article;
}

export function updateDemoArticle(id: string, input: ArticleInput) {
  const index = demoStore.articles.findIndex((article) => article.id === id);
  if (index < 0) return null;
  const existing = demoStore.articles[index];
  const taxonomy = resolveArticleTaxonomy({
    category: input.category,
    mainCategory: existing.mainCategory,
  });
  const publishedAt =
    input.status === "published"
      ? input.publishedAt ?? existing.publishedAt ?? new Date().toISOString()
      : input.publishedAt ?? existing.publishedAt;
  demoStore.articles[index] = {
    ...existing,
    ...input,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    publishedAt,
    updatedAt: new Date().toISOString(),
  };
  return demoStore.articles[index];
}
