import "server-only";

import OpenAI from "openai";
import type { ArticleLanguage } from "@/lib/article-types";

export type ArticleTranslationSource = {
  title: string;
  excerpt: string | null;
  content: string;
};

export type TranslatedArticleFields = {
  title: string;
  excerpt: string | null;
  content: string;
};

const TARGET_LANGUAGES: Array<{
  code: Exclude<ArticleLanguage, "en">;
  name: string;
}> = [
  { code: "te", name: "Telugu" },
  { code: "hi", name: "Hindi" },
];

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 120_000,
    maxRetries: 1,
  });
}

function parseTranslationJson(raw: string): TranslatedArticleFields {
  const parsed = JSON.parse(raw) as Partial<TranslatedArticleFields>;
  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
  const excerpt =
    typeof parsed.excerpt === "string"
      ? parsed.excerpt.trim() || null
      : parsed.excerpt === null
        ? null
        : null;

  if (!title) throw new Error("Translation response is missing a title.");
  if (!content) throw new Error("Translation response is missing content.");

  return { title, excerpt, content };
}

export async function translateArticleFields(
  source: ArticleTranslationSource,
  targetLanguageName: string,
): Promise<TranslatedArticleFields> {
  const client = getGroqClient();

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: [
          "You are a professional translator for aquaculture and shrimp industry news.",
          "Translate from English into the requested language.",
          "Preserve every HTML tag and attribute in the content field exactly as written.",
          "Only translate visible text inside HTML tags.",
          "Return ONLY valid JSON with keys: title, excerpt, content.",
          "Do not wrap the JSON in markdown fences.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Target language: ${targetLanguageName}`,
          `English title: ${JSON.stringify(source.title)}`,
          `English excerpt: ${JSON.stringify(source.excerpt || "")}`,
          `English content:\n${source.content}`,
        ].join("\n\n"),
      },
    ],
    temperature: 0.2,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Groq returned an empty translation response.");
  }

  return parseTranslationJson(raw);
}

export type TranslationBatchResult = Record<
  Exclude<ArticleLanguage, "en">,
  { ok: true; value: TranslatedArticleFields } | { ok: false; error: string }
>;

export async function translateArticleToAllLanguages(
  source: ArticleTranslationSource,
): Promise<TranslationBatchResult> {
  const results = {} as TranslationBatchResult;

  for (const target of TARGET_LANGUAGES) {
    try {
      const value = await translateArticleFields(source, target.name);
      results[target.code] = { ok: true, value };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown translation error.";
      console.error(`[article-translation:${target.code}]`, error);
      results[target.code] = { ok: false, error: message };
    }
  }

  return results;
}
