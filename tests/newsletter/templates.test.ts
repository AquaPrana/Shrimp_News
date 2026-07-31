import assert from "node:assert/strict";
import test from "node:test";
import {
  weeklyEmailTemplate,
  welcomeEmailTemplate,
} from "../../src/lib/newsletter/templates";
import {
  articleUrl,
  publicImageUrl,
  unsubscribeUrl,
} from "../../src/lib/newsletter/urls";

const siteUrl = "https://shrimp.news";
const token = "a".repeat(64);

test("welcome email includes required copy, CTA, plain text, and secure token URL", () => {
  const result = welcomeEmailTemplate(siteUrl, token);
  assert.match(result.html, /Thank you for subscribing to Shrimp\.News\./);
  assert.match(result.html, /Visit Shrimp\.News/);
  assert.match(result.html, /@media only screen and \(max-width: 620px\)/);
  assert.match(result.text, /Best Regards\nTeam Shrimp\.News/);
  assert.equal(
    result.unsubscribeLink,
    `https://shrimp.news/unsubscribe?token=${token}`,
  );
  assert.doesNotMatch(result.html, /localhost/i);
});

test("weekly email uses production article and image URLs", () => {
  const result = weeklyEmailTemplate(siteUrl, token, [
    {
      title: "Fresh shrimp market update",
      slug: "fresh-shrimp-market-update",
      category: "Markets & Industry",
      publishedAt: new Date("2026-07-27T03:30:00.000Z"),
      description: "<p>Prices and policy news.</p>",
      imageUrl: "/images/articles/market.jpg",
    },
  ]);

  assert.match(
    result.html,
    /https:\/\/shrimp\.news\/articles\/fresh-shrimp-market-update/,
  );
  assert.match(
    result.html,
    /https:\/\/shrimp\.news\/images\/articles\/market\.jpg/,
  );
  assert.match(result.html, /Read Article/);
  assert.match(result.text, /Fresh shrimp market update/);
  assert.doesNotMatch(result.html, /localhost/i);
});

test("weekly email omits an invalid or missing image", () => {
  const result = weeklyEmailTemplate(siteUrl, token, [
    {
      title: "No image article",
      slug: "no-image-article",
      category: "Shrimp Farming",
      publishedAt: new Date("2026-07-27T03:30:00.000Z"),
      description: null,
      imageUrl: null,
    },
  ]);
  assert.doesNotMatch(result.html, /<img class="article-image"/);
  assert.equal(publicImageUrl(siteUrl, "http://example.com/image.jpg"), null);
});

test("URL helpers never introduce localhost or subscriber details", () => {
  assert.equal(
    articleUrl(siteUrl, "weekly-update"),
    "https://shrimp.news/articles/weekly-update",
  );
  const url = unsubscribeUrl(siteUrl, token);
  assert.match(url, new RegExp(token));
  assert.doesNotMatch(url, /@|subscriber|localhost/i);
});
