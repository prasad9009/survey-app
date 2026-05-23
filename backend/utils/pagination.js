/**
 * Optional page/limit query params. When omitted, uses defaultLimit only (backward compatible).
 * @param {Record<string, unknown> | undefined} query
 * @param {{ defaultLimit?: number; maxLimit?: number }} [opts]
 */
export function parsePagination(query, { defaultLimit = 500, maxLimit = 500 } = {}) {
  const hasPage = query?.page !== undefined && query?.page !== ''
  const hasLimit = query?.limit !== undefined && query?.limit !== ''
  if (!hasPage && !hasLimit) {
    return { limit: defaultLimit, skip: 0, page: 1, paginated: false }
  }
  const limit = Math.min(Math.max(Number(query?.limit) || defaultLimit, 1), maxLimit)
  const page = Math.max(Number(query?.page) || 1, 1)
  return { limit, skip: (page - 1) * limit, page, paginated: true }
}
