import { CategoryArticlesView } from "@/components/articles/category-articles-view";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HealthPage() {
  const articles = await getPublishedArticles({
    language: "en",
    topic: "shrimp-health",
    limit: 60,
  });

  return (
    <CategoryArticlesView
      eyebrowKey="healthEyebrow"
      titleKey="healthTitle"
      descriptionKey="healthDescription"
      bodyKey="healthBody"
      topic="shrimp-health"
      initialArticles={articles}
    />
  );
}
