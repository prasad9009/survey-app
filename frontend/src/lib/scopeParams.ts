export function buildScopeParams(year: string, instrumentId: string | null | undefined) {
  return {
    year,
    ...(instrumentId ? { instrumentId } : {}),
  }
}
