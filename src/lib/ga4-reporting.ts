import "server-only";
import { createSign } from "node:crypto";

type ReportRow = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };
type Report = { rows?: ReportRow[]; totals?: { metricValues?: { value?: string }[] }[] };

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedToken: { value: string; expiresAt: number } | null = null;
async function accessToken(email: string, privateKey: string) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(privateKey))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), cache: "no-store" });
  const body = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description || "Google Analytics authentication failed.");
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in || 3600) * 1000 };
  return body.access_token;
}

function eventFilter(eventName: string) {
  return { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: eventName } } };
}

async function runReport(propertyId: string, token: string, body: Record<string, unknown>): Promise<Report> {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = await response.json() as Report & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || "Google Analytics report request failed.");
  return data;
}

const metric = (report: Report, index: number) => Number(report.totals?.[0]?.metricValues?.[index]?.value || 0);
const value = (row: ReportRow, index: number) => row.dimensionValues?.[index]?.value || "";
const number = (row: ReportRow, index: number) => Number(row.metricValues?.[index]?.value || 0);

export function ga4Configured() {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY);
}

export async function getAnalyticsReport(startDate: string, endDate: string, previousStart: string, previousEnd: string) {
  const propertyId = process.env.GA4_PROPERTY_ID!;
  const token = await accessToken(process.env.GA4_CLIENT_EMAIL!, process.env.GA4_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const base = (eventName: string, start = startDate, end = endDate) => ({ dateRanges: [{ startDate: start, endDate: end }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: eventFilter(eventName), metricAggregations: ["TOTAL"] });
  const [articles, previousArticles, tickerClicks] = await Promise.all([
    runReport(propertyId, token, base("article_view")),
    runReport(propertyId, token, base("article_view", previousStart, previousEnd)),
    runReport(propertyId, token, base("ticker_click")),
  ]);

  let articleRows: { id: string; title: string; category: string; views: number; uniqueReaders: number; averageReadingTime: number; publicationDate: string }[] = [];
  let tickerRows: { id: string; campaign: string; destinationUrl: string; impressions: number; clicks: number; uniqueClicks: number; ctr: number }[] = [];
  let detailNotice: string | null = null;
  try {
    const [articleDetail, clicksDetail, impressionsDetail] = await Promise.all([
      runReport(propertyId, token, { dateRanges: [{ startDate, endDate }], dimensions: ["customEvent:article_id", "customEvent:article_title", "customEvent:category", "customEvent:publication_date"].map((name) => ({ name })), metrics: ["eventCount", "totalUsers", "averageSessionDuration"].map((name) => ({ name })), dimensionFilter: eventFilter("article_view"), orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 50 }),
      runReport(propertyId, token, { dateRanges: [{ startDate, endDate }], dimensions: ["customEvent:ticker_id", "customEvent:campaign_name", "customEvent:destination_url"].map((name) => ({ name })), metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: eventFilter("ticker_click"), limit: 100 }),
      runReport(propertyId, token, { dateRanges: [{ startDate, endDate }], dimensions: ["customEvent:ticker_id", "customEvent:campaign_name", "customEvent:destination_url"].map((name) => ({ name })), metrics: [{ name: "eventCount" }], dimensionFilter: eventFilter("ticker_impression"), limit: 100 }),
    ]);
    articleRows = (articleDetail.rows || []).map((row) => ({ id: value(row, 0), title: value(row, 1) || "Untitled article", category: value(row, 2), publicationDate: value(row, 3), views: number(row, 0), uniqueReaders: number(row, 1), averageReadingTime: Math.round(number(row, 2)) }));
    const impressions = new Map((impressionsDetail.rows || []).map((row) => [value(row, 0), number(row, 0)]));
    tickerRows = (clicksDetail.rows || []).map((row) => { const clicks = number(row, 0); const shown = impressions.get(value(row, 0)) || 0; return { id: value(row, 0), campaign: value(row, 1) || "Ticker campaign", destinationUrl: value(row, 2), impressions: shown, clicks, uniqueClicks: number(row, 1), ctr: shown ? clicks / shown * 100 : 0 }; }).sort((a, b) => b.clicks - a.clicks);
  } catch {
    detailNotice = "Register the listed event parameters as GA4 custom dimensions to populate the performance tables.";
  }
  const articleViews = metric(articles, 0); const previousViews = metric(previousArticles, 0);
  return { cards: { articleViews, uniqueReaders: metric(articles, 1), tickerClicks: metric(tickerClicks, 0), telaquaClicks: tickerRows.filter((row) => /telaqua/i.test(row.campaign)).reduce((sum, row) => sum + row.clicks, 0), articleViewsChange: previousViews ? (articleViews - previousViews) / previousViews * 100 : null }, articles: articleRows, tickers: tickerRows, detailNotice };
}
