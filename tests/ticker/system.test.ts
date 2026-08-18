import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeTickerItemType, tickerDisplayDetail, tickerDisplayHeading, type MarketPriceItem } from "../../src/lib/market-data/client";
import { normalizeTickerUrl } from "../../src/lib/ticker-url";

function item(overrides: Partial<MarketPriceItem>): MarketPriceItem {
  return {
    id: "ticker-1",
    label: "Visit Tel-Aqua",
    value: "Explore Tel-Aqua products and solutions • Visit Website →",
    description: "Explore Tel-Aqua products and solutions",
    type: "external_link",
    linkUrl: "https://telaqua.com/",
    linkLabel: "Visit Website",
    imageUrl: null,
    couponCode: null,
    campaignName: "Visit Tel-Aqua",
    displayOrder: 0,
    updatedAt: "2026-08-18T00:00:00.000Z",
    ...overrides,
  };
}

test("normalizes production legacy ticker types without turning messages into market prices", () => {
  assert.equal(normalizeTickerItemType("website_link"), "external_link");
  assert.equal(normalizeTickerItemType("coupon_code"), "coupon");
  assert.equal(normalizeTickerItemType("update"), "external_link");
  assert.equal(normalizeTickerItemType("unexpected_message_type"), "custom_message");
});

test("uses price values for price types and descriptions for message types", () => {
  assert.equal(tickerDisplayDetail(item({ type: "market", value: "₹445/kg", description: "ignored" })), "₹445/kg");
  assert.equal(tickerDisplayDetail(item({ type: "external_link" })), "Explore Tel-Aqua products and solutions");
  assert.equal(tickerDisplayDetail(item({ type: "announcement", label: "Plain announcement", value: "Plain announcement", description: null })), "");
});

test("separates the Tel-Aqua brand from its tagline without changing other titles", () => {
  assert.deepEqual(tickerDisplayHeading("Tel-Aqua Lab in your Pocket"), {
    brand: "Tel-Aqua",
    tagline: "Lab in your Pocket",
  });
  assert.deepEqual(tickerDisplayHeading("Visit Tel-Aqua"), {
    brand: "Visit Tel-Aqua",
    tagline: "",
  });
});

test("accepts and normalizes HTTP(S) ticker links", () => {
  assert.deepEqual(normalizeTickerUrl("https://telaqua.com"), { ok: true, value: "https://telaqua.com/" });
  assert.deepEqual(normalizeTickerUrl("http://example.com"), { ok: true, value: "http://example.com/" });
  assert.deepEqual(normalizeTickerUrl("example.com"), { ok: true, value: "https://example.com/" });
});

test("rejects unsafe ticker link protocols", () => {
  assert.equal(normalizeTickerUrl("javascript:alert(1)").ok, false);
  assert.equal(normalizeTickerUrl("data:text/html,test").ok, false);
});

test("public loading never seeds or serves the demo price payload", () => {
  const hookSource = readFileSync("src/hooks/use-market-prices.ts", "utf8");
  const routeSource = readFileSync("src/app/api/ticker/route.ts", "utf8");
  assert.doesNotMatch(hookSource, /buildDemoMarketPricesPayload/);
  assert.doesNotMatch(routeSource, /buildDemoMarketPricesPayload/);
  assert.match(hookSource, /items:\s*\[\]/);
});

test("both infinite-scroll copies use the same linked ticker row", () => {
  const componentSource = readFileSync("src/components/homepage/market-ticker.tsx", "utf8");
  assert.match(componentSource, /tickerItems\.map\(\(item\) => <TickerItemRow key=\{item\.id\}/);
  assert.match(componentSource, /tickerItems\.map\(\(item\) => <TickerItemRow key=\{`loop-\$\{item\.id\}`\}/);
  assert.doesNotMatch(componentSource, /interactive=\{false\}/);
});
