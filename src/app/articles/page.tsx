import { ArticlesPageClient } from "@/components/articles/articles-page-client";
import { isArticleTopic } from "@/lib/public-articles-shared";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ topic?: string }>;
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { topic: topicParam } = await searchParams;
  const topic = isArticleTopic(topicParam) ? topicParam : null;
  const articles = await getPublishedArticles({
    language: "en",
    topic,
    limit: 60,
  });

  return (
    <ArticlesPageClient topicParam={topic} initialArticles={articles} />
  );
}
