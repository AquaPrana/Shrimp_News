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
  // prepareArticleContentForDisplay always re-sanitizes spacer HTML from older articles.
  let html = prepareArticleContentForDisplay(content);
  if (compactLegacySpacing) {
    html = collapseLegacyArticleWhitespace(html);
  }
  if (!html) return null;

  return (
    <div
      className={`article-prose ${
        compactLegacySpacing ? "article-prose-legacy" : ""
      } ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
