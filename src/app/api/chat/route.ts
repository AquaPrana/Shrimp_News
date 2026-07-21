import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  message?: string;
  language?: string;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    console.log("Groq key loaded:", Boolean(apiKey));
    console.log("Groq key length:", apiKey?.length ?? 0);

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is not loaded. Restart the Next.js development server.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();
    const language = body.language?.trim() || "English";

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 30000,
      maxRetries: 1,
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are Ask Prana, the AI assistant for Shrimp News.

Only answer questions related to:
- shrimp farming
- shrimp health and diseases
- pond management
- water quality
- shrimp feed and FCR
- biosecurity
- aquaculture technology
- shrimp markets and exports
- seafood terminology

Respond in ${language}.

Give a clear and direct answer first.
Then provide practical details using short paragraphs or numbered points.
Use simple language.
Do not invent live prices, current regulations, recent news, or treatments.
For disease and treatment questions, recommend consulting a qualified aquatic animal health professional.
If information may have changed recently, clearly say it should be verified.
          `.trim(),
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
      top_p: 0.85,
      max_tokens: 700,
      stream: false,
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "Ask Prana returned an empty answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Groq Ask Prana error:", error);

    if (error instanceof OpenAI.APIError) {
      let message = error.message;

      if (error.status === 401) {
        message = "The Groq API key is invalid.";
      } else if (error.status === 429) {
        message =
          "Ask Prana has reached the temporary free usage limit. Please wait and try again.";
      } else if (error.status === 404) {
        message =
          "The selected Groq model was not found. Check the model name.";
      }

      return NextResponse.json(
        { error: message },
        { status: error.status ?? 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ask Prana could not answer right now.",
      },
      { status: 500 }
    );
  }
}