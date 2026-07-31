import "server-only";

import { Resend } from "resend";
import { getNewsletterConfig } from "@/lib/newsletter/config";
import {
  type NewsletterArticle,
  weeklyEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/newsletter/templates";

type ProviderError = {
  name?: string;
  statusCode?: number;
};

export class NewsletterDeliveryError extends Error {
  constructor(public readonly safeMessage: string) {
    super(safeMessage);
    this.name = "NewsletterDeliveryError";
  }
}

function safeProviderError(error: unknown) {
  const value = error && typeof error === "object" ? (error as ProviderError) : {};
  const name =
    typeof value.name === "string"
      ? value.name.replace(/[^a-z0-9_-]/gi, "").slice(0, 80)
      : "provider_error";
  const status =
    typeof value.statusCode === "number" ? `:${value.statusCode}` : "";
  return `${name || "provider_error"}${status}`;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
  unsubscribeLink: string,
  idempotencyKey: string,
) {
  const config = getNewsletterConfig();
  const resend = new Resend(config.apiKey);

  try {
    const result = await resend.emails.send(
      {
        from: config.fromEmail,
        to: [to],
        subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsubscribeLink}>`,
        },
      },
      { idempotencyKey },
    );

    if (result.error) {
      throw new NewsletterDeliveryError(safeProviderError(result.error));
    }
    if (!result.data?.id) {
      throw new NewsletterDeliveryError("provider_missing_message_id");
    }
    return result.data.id;
  } catch (error) {
    if (error instanceof NewsletterDeliveryError) throw error;
    throw new NewsletterDeliveryError(safeProviderError(error));
  }
}

export async function sendWelcomeEmail(input: {
  subscriberId: string;
  email: string;
  unsubscribeToken: string;
  subscriptionVersion: number;
}) {
  const config = getNewsletterConfig();
  const template = welcomeEmailTemplate(config.siteUrl, input.unsubscribeToken);
  return send(
    input.email,
    "Welcome to Shrimp.News",
    template.html,
    template.text,
    template.unsubscribeLink,
    `welcome/${input.subscriberId}/${input.subscriptionVersion}`,
  );
}

export async function sendWeeklyNewsletter(input: {
  subscriberId: string;
  email: string;
  unsubscribeToken: string;
  newsletterWeek: string;
  articles: NewsletterArticle[];
}) {
  const config = getNewsletterConfig();
  const template = weeklyEmailTemplate(
    config.siteUrl,
    input.unsubscribeToken,
    input.articles,
  );
  return send(
    input.email,
    "This Week on Shrimp.News – Latest Industry Updates",
    template.html,
    template.text,
    template.unsubscribeLink,
    `weekly/${input.subscriberId}/${input.newsletterWeek}`,
  );
}
