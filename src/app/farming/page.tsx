import { CategoryArticlesView } from "@/components/articles/category-articles-view";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FarmingPage() {
  const articles = await getPublishedArticles({
    language: "en",
    topic: "shrimp-farming",
    limit: 60,
  });

  return (
    <CategoryArticlesView
      eyebrowKey="farmingEyebrow"
      titleKey="farmingPageTitle"
      descriptionKey="farmingPageDescription"
      bodyKey="farmingBody"
      topic="shrimp-farming"
      initialArticles={articles}
    />
  );
}
