import { launchArticles } from "@/data/articles";
import { baseSlug } from "@/lib/public-articles-shared";

const LEGACY_LAUNCH_SLUGS = new Set(launchArticles.map((article) => article.slug));

/** True for the original seed/launch articles already in the project (all languages). */
export function isLegacyLaunchArticleSlug(slug: string) {
  return LEGACY_LAUNCH_SLUGS.has(baseSlug(slug));
}
