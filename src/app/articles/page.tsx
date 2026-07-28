import { ArticlesPageClient } from "@/components/articles/articles-page-client";
import { normalizeArticleTopic } from "@/lib/public-articles-shared";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ topic?: string; q?: string }>;
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { topic: topicParam, q: qParam } = await searchParams;
  const topic = normalizeArticleTopic(topicParam);
  const q = qParam?.trim() || null;
  const articles = await getPublishedArticles({
    topic,
    q,
    limit: 60,
  });

  return (
    <ArticlesPageClient
      topicParam={topic}
      query={q}
      initialArticles={articles}
    />
  );
}
