import { CategoryArticlesView } from "@/components/articles/category-articles-view";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DomesticConsumptionPage() {
  const articles = await getPublishedArticles({
    language: "en",
    topic: "domestic-consumption",
    limit: 60,
  });

  return (
    <CategoryArticlesView
      eyebrowKey="domesticEyebrow"
      titleKey="domesticPageTitle"
      descriptionKey="domesticPageDescription"
      bodyKey="domesticBody"
      topic="domestic-consumption"
      initialArticles={articles}
    />
  );
}
