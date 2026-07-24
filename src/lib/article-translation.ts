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

const TARGET_LANGUAGES = [
  { code: "te", name: "Telugu" },
  { code: "hi", name: "Hindi" },
] as const;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 120_000,
    maxRetries: 1,
  });
}

function translationModel() {
  return (
    process.env.GROQ_TRANSLATION_MODEL?.trim() ||
    "openai/gpt-oss-20b"
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function splitTranslationContent(content: string, maxCharacters = 4000) {
  if (content.length <= maxCharacters) return [content];
  const parts = content.split(
    /(?<=<\/(?:p|h[1-6]|li|blockquote|div|section)>|\n\n)/gi,
  );
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length > maxCharacters) {
      chunks.push(current);
      current = "";
    }
    if (part.length > maxCharacters) {
      for (let index = 0; index < part.length; index += maxCharacters) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        chunks.push(part.slice(index, index + maxCharacters));
      }
    } else {
      current += part;
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function translateMetadata(
  source: ArticleTranslationSource,
  targetLanguageName: string,
) {
  const completion = await getGroqClient().chat.completions.create({
    model: translationModel(),
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content: [
          "You translate aquaculture and shrimp industry news professionally.",
          `Translate the title and summary into ${targetLanguageName}.`,
          "Do not leave either field in English.",
          "If the English summary is empty, create a concise summary from the content sample.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `English title: ${JSON.stringify(source.title)}`,
          `English summary: ${JSON.stringify(source.excerpt || "")}`,
          `English content sample: ${source.content.slice(0, 2000)}`,
        ].join("\n\n"),
      },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_translation_metadata",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
          },
          required: ["title", "excerpt"],
        },
      },
    },
  });
  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Groq returned empty translation metadata.");
  const parsed = JSON.parse(raw) as { title?: string; excerpt?: string };
  const title = parsed.title?.trim() || "";
  const excerpt = parsed.excerpt?.trim() || "";
  if (!title || !excerpt) {
    throw new Error("Translation response is missing title or summary.");
  }
  return { title, excerpt };
}

async function translateContentChunk(
  content: string,
  targetLanguageName: string,
) {
  const completion = await getGroqClient().chat.completions.create({
    model: translationModel(),
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content: [
          "You translate aquaculture and shrimp industry news professionally.",
          `Translate the supplied English fragment into ${targetLanguageName}.`,
          "Preserve every HTML tag and attribute exactly as written.",
          "Translate all visible prose; retain proper names and technical abbreviations when appropriate.",
          "Return only the translated fragment, without JSON, markdown fences, explanations, or a preface.",
        ].join(" "),
      },
      { role: "user", content },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });
  const translated = completion.choices[0]?.message?.content?.trim();
  if (!translated) throw new Error("Groq returned empty translated content.");
  return translated;
}

export async function translateArticleFields(
  source: ArticleTranslationSource,
  targetLanguageName: string,
): Promise<TranslatedArticleFields> {
  const metadata = await translateMetadata(source, targetLanguageName);
  const chunks = splitTranslationContent(source.content);
  const translatedChunks: string[] = [];
  const chunkDelay = Math.max(
    250,
    Number(process.env.GROQ_TRANSLATION_CHUNK_DELAY_MS || 1200),
  );
  for (const chunk of chunks) {
    translatedChunks.push(
      await translateContentChunk(chunk, targetLanguageName),
    );
    if (translatedChunks.length < chunks.length) await wait(chunkDelay);
  }
  return {
    title: metadata.title,
    excerpt: metadata.excerpt,
    content: translatedChunks.join(""),
  };
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
      results[target.code] = {
        ok: true,
        value: await translateArticleFields(source, target.name),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown translation error.";
      console.error(`[article-translation:${target.code}]`, error);
      results[target.code] = { ok: false, error: message };
    }
  }
  return results;
}
