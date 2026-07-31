const PUBLIC_IMAGE_PATH = /^\/(?:images|uploads)\/[^\s?#]+(?:\?[^\s#]*)?$/i;

export function articleUrl(siteUrl: string, slug: string) {
  return new URL(`/articles/${encodeURIComponent(slug)}`, siteUrl).toString();
}

export function unsubscribeUrl(siteUrl: string, token: string) {
  const url = new URL("/unsubscribe", siteUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export function publicImageUrl(siteUrl: string, value: string | null) {
  const candidate = value?.trim();
  if (!candidate) return null;

  if (candidate.startsWith("/")) {
    return PUBLIC_IMAGE_PATH.test(candidate)
      ? new URL(candidate, siteUrl).toString()
      : null;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
