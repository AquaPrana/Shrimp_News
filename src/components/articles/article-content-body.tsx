import {
  collapseLegacyArticleWhitespace,
  prepareArticleContentForDisplay,
} from "@/lib/article-content";

type ArticleContentBodyProps = {
  content: string;
  className?: string;
  /** Tighten spacing for older seed articles only (display-time; does not change stored HTML). */
  compactLegacySpacing?: boolean;
};

export function ArticleContentBody({
  content,
  className = "",
  compactLegacySpacing = false,
}: ArticleContentBodyProps) {
  let html = prepareArticleContentForDisplay(content);
  if (compactLegacySpacing) {
    html = collapseLegacyArticleWhitespace(html);
  }
  if (!html) return null;

  return (
    <div
      className={`article-prose ${
        compactLegacySpacing ? "article-prose-legacy" : "space-y-5"
      } ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
