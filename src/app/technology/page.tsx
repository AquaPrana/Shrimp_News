import { Suspense } from "react";
import { CategoryArticlesView } from "@/components/articles/category-articles-view";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ topic?: string }>;
};

async function TechnologyArticles({ topic }: { topic: string }) {
  const articles = await getPublishedArticles({
    language: "en",
    topic,
    limit: 60,
  });

  return (
    <CategoryArticlesView
      eyebrowKey="techEyebrow"
      titleKey="techTitle"
      descriptionKey="techDescription"
      bodyKey="techBody"
      topic={topic}
      initialArticles={articles}
    />
  );
}

export default async function TechnologyPage({ searchParams }: PageProps) {
  const { topic: topicParam } = await searchParams;
  const topic = topicParam === "research" ? "research" : "technology";

  return (
    <Suspense fallback={null}>
      <TechnologyArticles topic={topic} />
    </Suspense>
  );
}
