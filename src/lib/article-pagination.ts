type ArticlePaginationOptions = {
  limit?: number;
  page?: number;
};

export function normalizeArticlePagination(options: ArticlePaginationOptions) {
  const rawLimit = options.limit;
  const limit = typeof rawLimit === "number" && Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 60;

  // Prisma/MySQL pagination arguments must be finite integers. Keep `take`
  // within the signed 32-bit range even for an untrusted, extremely large page.
  const maxPage = Math.floor((2_147_483_647 - limit) / limit) + 1;
  const rawPage = options.page;
  const page = typeof rawPage === "number" && Number.isFinite(rawPage)
    ? Math.min(Math.max(Math.trunc(rawPage), 1), maxPage)
    : 1;
  const skip = (page - 1) * limit;

  return { limit, page, skip };
}
