import { articleUrl, publicImageUrl, unsubscribeUrl } from "@/lib/newsletter/urls";

export type NewsletterArticle = {
  title: string;
  slug: string;
  category: string;
  publishedAt: Date;
  description: string | null;
  imageUrl: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value: string | null) {
  return (value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function description(value: string | null) {
  const plain = stripHtml(value);
  return plain.length > 240 ? `${plain.slice(0, 237).trimEnd()}...` : plain;
}

function layout(content: string, unsubscribeLink: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { width: 100% !important; }
        .email-body { padding: 24px 18px !important; }
        .email-button { display: block !important; text-align: center !important; }
        .article-image { height: auto !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:#f3f6f9;color:#17324d;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#0B4F7A;padding:22px 28px;border-bottom:4px solid #FF5A2F;">
                <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:.2px;">Shrimp.News</div>
              </td>
            </tr>
            <tr>
              <td class="email-body" style="padding:34px 32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;line-height:20px;color:#64748b;">
                You received this email because you subscribed to Shrimp.News.<br>
                <a href="${escapeHtml(unsubscribeLink)}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmailTemplate(siteUrl: string, token: string) {
  const visitUrl = new URL("/", siteUrl).toString();
  const unsubscribeLink = unsubscribeUrl(siteUrl, token);
  const html = layout(
    `<p style="margin:0 0 18px;font-size:16px;line-height:26px;">Hi,</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:26px;">Thank you for subscribing to Shrimp.News.</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:26px;">You're all set! We'll keep you updated with the latest shrimp industry news, market insights, prices, policy updates, and farming knowledge.</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:26px;">Stay tuned for our upcoming updates.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#FF5A2F;border-radius:8px;">
          <a class="email-button" href="${escapeHtml(visitUrl)}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">Visit Shrimp.News</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:16px;line-height:25px;">Best Regards<br><strong>Team Shrimp.News</strong><br><a href="${escapeHtml(visitUrl)}" style="color:#0B4F7A;">https://shrimp.news/</a></p>`,
    unsubscribeLink,
  );

  const text = `Hi,

Thank you for subscribing to Shrimp.News.

You're all set! We'll keep you updated with the latest shrimp industry news, market insights, prices, policy updates, and farming knowledge.

Stay tuned for our upcoming updates.

Best Regards
Team Shrimp.News
https://shrimp.news/

Unsubscribe: ${unsubscribeLink}`;

  return { html, text, unsubscribeLink };
}

export function weeklyEmailTemplate(
  siteUrl: string,
  token: string,
  articles: NewsletterArticle[],
) {
  const visitUrl = new URL("/", siteUrl).toString();
  const unsubscribeLink = unsubscribeUrl(siteUrl, token);
  const articleCards = articles
    .map((article) => {
      const url = articleUrl(siteUrl, article.slug);
      const image = publicImageUrl(siteUrl, article.imageUrl);
      const summary = description(article.description);
      const published = article.publishedAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border:1px solid #e2e8f0;">
        ${image ? `<tr><td><img class="article-image" src="${escapeHtml(image)}" alt="" width="534" style="display:block;width:100%;max-width:534px;height:auto;border:0;"></td></tr>` : ""}
        <tr>
          <td style="padding:22px;">
            <div style="margin:0 0 8px;color:#FF5A2F;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">${escapeHtml(article.category)}</div>
            <h2 style="margin:0 0 10px;color:#0B3A6E;font-size:21px;line-height:28px;">${escapeHtml(article.title)}</h2>
            <div style="margin:0 0 13px;color:#64748b;font-size:13px;">${escapeHtml(published)}</div>
            ${summary ? `<p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:24px;">${escapeHtml(summary)}</p>` : ""}
            <a href="${escapeHtml(url)}" style="display:inline-block;padding:11px 18px;background:#FF5A2F;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:7px;">Read Article</a>
          </td>
        </tr>
      </table>`;
    })
    .join("");

  const html = layout(
    `<h1 style="margin:0 0 22px;color:#0B3A6E;font-size:27px;line-height:34px;">Shrimp.News Weekly Update</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:26px;">Hi,</p>
    <p style="margin:0 0 26px;font-size:16px;line-height:26px;">Here are this week's latest shrimp industry updates.</p>
    ${articleCards}
    <p style="margin:4px 0 18px;font-size:16px;line-height:26px;">Stay informed with Shrimp.News.</p>
    <p style="margin:0;font-size:16px;line-height:25px;">Best Regards<br><strong>Team Shrimp.News</strong><br><a href="${escapeHtml(visitUrl)}" style="color:#0B4F7A;">https://shrimp.news/</a></p>`,
    unsubscribeLink,
  );

  const articleText = articles
    .map((article) => {
      const published = article.publishedAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      const summary = description(article.description);
      return [
        article.title,
        `${article.category} | ${published}`,
        summary,
        `Read Article: ${articleUrl(siteUrl, article.slug)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const text = `Shrimp.News Weekly Update

Hi,

Here are this week's latest shrimp industry updates.

${articleText}

Stay informed with Shrimp.News.

Best Regards
Team Shrimp.News
https://shrimp.news/

Unsubscribe: ${unsubscribeLink}`;

  return { html, text, unsubscribeLink };
}
