/** Per-domain stale times (ms) — fresh enough for background refetch. */
export const STALE_TIMES = {
  dashboard: 60_000,
  clients: 600_000,
  sites: 600_000,
  visits: 300_000,
  accountManager: 180_000,
  reports: 300_000,
  settings: 1_800_000,
  admins: 600_000,
} as const
