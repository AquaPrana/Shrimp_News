"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  answer?: string;
  error?: string;
};

const suggestions = [
  "White feces in my pond — what now?",
  "ఈ వారం రొయ్యల ధర ఎలా ఉంది?",
  "Ideal DO level for vannamei?",
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function detectLanguage(text: string) {
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return "Telugu";
  }

  if (/[\u0900-\u097F]/.test(text)) {
    return "Hindi";
  }

  return "English";
}

export default function AskAquaPranaPage() {
  const router = useRouter();

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  function scrollToLatestMessage() {
    window.requestAnimationFrame(() => {
      const container = messagesContainerRef.current;

      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  }

  useEffect(() => {
    scrollToLatestMessage();
  }, [messages, isLoading]);

  async function askAquaGPT(value?: string) {
    const prompt = (value ?? question).trim();

    if (!prompt || isLoading) {
      return;
    }

    const previousMessages = messages;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: prompt,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const conversationContext = previousMessages
        .slice(-6)
        .map((message) => {
          const speaker =
            message.role === "user" ? "User" : "AquaGPT";

          return `${speaker}: ${message.content}`;
        })
        .join("\n\n");

      const completePrompt = conversationContext
        ? `Continue this conversation naturally.

Previous conversation:
${conversationContext}

Current user question:
${prompt}`
        : prompt;

      const request = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: completePrompt,
          language: detectLanguage(prompt),
        }),
      });

      const data = (await request.json()) as ChatApiResponse;

      if (!request.ok) {
        throw new Error(
          data.error || "AquaGPT could not answer right now.",
        );
      }

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content:
          data.answer ||
          "I could not generate an answer. Please try again.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "AquaGPT could not answer right now.",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsLoading(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAquaGPT();
  }

  return (
    <main className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-800">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl text-cyan-500">✦</span>
              <h1 className="text-lg font-extrabold text-[#0B3A6E] sm:text-xl">
                Ask AquaGPT
              </h1>
            </div>

            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              AI Online
            </span>

            <span className="hidden text-sm text-slate-500 sm:inline">
              Aquaculture only · English / తెలుగు / हिंदी
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close AquaGPT"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#0B3A6E]"
          >
            ×
          </button>
        </div>
      </header>

      <div className="shrink-0 px-4 pt-4 sm:px-5">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-[#F7FBFF] px-4 py-3 text-sm leading-6 text-slate-700 sm:px-5">
          Namaste! I’m AquaGPT — ask me anything about shrimp
          farming, water quality, disease, feed or markets. English,
          తెలుగు లేదా हिंदीలో అడగండి.
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-5"
      >
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-end gap-5">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <p className="text-xl font-semibold text-[#0B3A6E]">
                  How can AquaGPT help?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Ask about farming, pond health, feed, water
                  quality, disease or shrimp markets.
                </p>
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`whitespace-pre-wrap rounded-2xl px-5 py-4 text-sm leading-7 sm:text-base ${
                  message.role === "user"
                    ? "max-w-[85%] rounded-br-md bg-cyan-500 text-slate-950 sm:max-w-[70%]"
                    : "max-w-[95%] rounded-bl-md border border-slate-200 bg-[#F7FBFF] text-slate-700 sm:max-w-[82%]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-slate-200 bg-[#F7FBFF] px-5 py-4 text-sm text-slate-600">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                </div>
                AquaGPT is thinking...
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-5">
        <div className="mx-auto w-full max-w-5xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-stretch gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your pond, disease, feed, prices..."
              disabled={isLoading}
              autoFocus
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60 sm:min-h-14 sm:px-5 sm:text-base"
            />

            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="min-h-12 shrink-0 rounded-2xl bg-cyan-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-14 sm:px-8 sm:text-base"
            >
              {isLoading ? "..." : "Ask"}
            </button>
          </form>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isLoading}
                onClick={() => void askAquaGPT(suggestion)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#0B3A6E] disabled:opacity-50 sm:text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
