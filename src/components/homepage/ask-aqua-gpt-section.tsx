"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

type ChatResponse = {
  answer?: string;
  error?: string;
};

export function AskAquaGPTSection() {
  const { t, language } = useLanguage();

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const prompts = [
    t("aquaPrompt1"),
    t("aquaPrompt2"),
    t("aquaPrompt3"),
  ];

  async function ask(value?: string) {
    const prompt = (value ?? question).trim();

    if (!prompt) {
      setResponse(t("aquaGptEmpty"));
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setResponse(null);

    const languageLabel =
      language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English";

    try {
      const request = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          language: languageLabel,
        }),
      });

      const data = (await request.json()) as ChatResponse;

      if (!request.ok) {
        throw new Error(data.error || "Unable to get an answer.");
      }

      setResponse(data.answer || "No response received.");
    } catch (error) {
      setResponse(
        error instanceof Error
          ? error.message
          : "Ask Prana could not answer right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void ask();
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-cyan-300/20 bg-[#0B4F7A] p-5 shadow-[0_24px_70px_rgba(11,79,122,0.28)] sm:rounded-[32px] sm:p-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-orange-300">
            <span className="h-[1px] w-10 shrink-0 bg-orange-300/60" />
            {t("aquaGptEyebrow")}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {t("aquaGptTitle")}
          </h2>

          <p className="max-w-2xl text-sm leading-7 text-cyan-50/85 sm:text-base">
            {t("aquaGptDescription")}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-white/10 bg-[#062849] p-4 sm:rounded-[28px] sm:p-5">
          <div className="flex items-center gap-3 text-sm text-cyan-50">
            <span
              className={`inline-flex h-3 w-3 shrink-0 rounded-full ${
                isLoading ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span>
              {isLoading ? "Ask Prana is thinking..." : t("aquaGptOnline")}
            </span>
          </div>

          <div>
            <label className="sr-only" htmlFor="aqua-input">
              {t("aquaGptEyebrow")}
            </label>
            <input
              id="aqua-input"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("aquaGptPlaceholder")}
              disabled={isLoading}
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cyan-100/50 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => void ask(prompt)}
                disabled={isLoading}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-cyan-50 transition hover:border-sky-400/60 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-xs sm:tracking-[0.22em]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void ask()}
              disabled={isLoading}
            >
              {isLoading ? "Thinking..." : t("ask")}
            </Button>
          </div>

          {(response || isLoading) && (
            <div
              className="max-h-[220px] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-cyan-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:rounded-3xl"
              aria-live="polite"
            >
              {response ? (
                <div className="whitespace-pre-wrap">{response}</div>
              ) : (
                <p className="text-cyan-100/55">
                  Ask Prana is preparing your answer...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
