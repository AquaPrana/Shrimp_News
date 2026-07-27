import { HomePage } from "@/components/homepage/home-page";
import { getPublishedArticles } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // All language fields are returned; client selects via LanguageProvider.
  const articles = await getPublishedArticles({ limit: 60 });
  return <HomePage initialArticles={articles} />;
}
