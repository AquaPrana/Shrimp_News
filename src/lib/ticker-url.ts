export type NormalizedTickerUrl =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export function normalizeTickerUrl(raw: unknown, label = "Link URL"): NormalizedTickerUrl {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: true, value: null };
  }

  try {
    const trimmed = raw.trim();
    const hasProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
    const value = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    if (!value.hostname || !["http:", "https:"].includes(value.protocol)) throw new Error();
    return { ok: true, value: value.toString() };
  } catch {
    return { ok: false, error: `${label} must be a valid HTTP or HTTPS URL.` };
  }
}
