export type AvailableSocialLink<TLanguage extends string> = {
  language: TLanguage;
  url: string;
};

export function isValidSocialUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;

  const value = url.trim();
  if (!value || value === "#" || value.toLowerCase() === "coming-soon") {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getAvailableSocialLinks<TLanguage extends string>(
  links: Partial<Record<TLanguage, string | null | undefined>>,
  languageOrder: readonly TLanguage[],
): AvailableSocialLink<TLanguage>[] {
  return languageOrder.flatMap((language) => {
    const url = links[language];
    return isValidSocialUrl(url)
      ? [{ language, url: url.trim() }]
      : [];
  });
}
