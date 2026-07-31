import "server-only";

export class NewsletterConfigurationError extends Error {
  readonly code = "NEWSLETTER_CONFIGURATION_ERROR";

  constructor(public readonly variable: string) {
    super(`Missing or invalid required server environment variable: ${variable}`);
    this.name = "NewsletterConfigurationError";
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new NewsletterConfigurationError(name);
  return value;
}

export function getNewsletterConfig() {
  const apiKey = required("RESEND_API_KEY");
  const fromEmail = required("NEWSLETTER_FROM_EMAIL");
  const rawSiteUrl = required("NEXT_PUBLIC_SITE_URL");

  if (!apiKey.startsWith("re_")) {
    throw new NewsletterConfigurationError("RESEND_API_KEY");
  }
  const senderMatch = fromEmail.match(/<([^<>]+)>$/);
  const senderAddress = (senderMatch?.[1] || fromEmail).trim().toLowerCase();
  if (senderAddress !== "newsletter@shrimp.news") {
    throw new NewsletterConfigurationError("NEWSLETTER_FROM_EMAIL");
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(rawSiteUrl);
  } catch {
    throw new NewsletterConfigurationError("NEXT_PUBLIC_SITE_URL");
  }

  if (
    siteUrl.protocol !== "https:" ||
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.hostname === "localhost" ||
    siteUrl.hostname === "127.0.0.1" ||
    !["shrimp.news", "www.shrimp.news"].includes(siteUrl.hostname)
  ) {
    throw new NewsletterConfigurationError("NEXT_PUBLIC_SITE_URL");
  }

  return {
    apiKey,
    fromEmail,
    siteUrl: siteUrl.origin,
  };
}

export function getCronSecret() {
  return required("CRON_SECRET");
}
