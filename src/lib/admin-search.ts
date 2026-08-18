export type AdminSearchResultType = "article" | "event" | "ticker" | "subscriber";

export type AdminSearchResult = {
  id: string;
  type: AdminSearchResultType;
  title: string;
  subtitle: string;
  href: string;
};

export function normalizeAdminSearchQuery(value: string) {
  return value.trim().toLowerCase().slice(0, 120);
}
