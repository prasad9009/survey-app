/**
 * Keep-Alive Self-Ping Service
 * ----------------------------
 * Render free-tier instances spin down after ~15 minutes of inactivity.
 * This module pings the server's own /health endpoint at a configurable
 * interval to prevent cold starts.
 *
 * HOW IT WORKS:
 *   - In production on Render, RENDER_EXTERNAL_URL is set automatically
 *     (e.g. "https://samarth-surveyos-api.onrender.com").
 *   - The service makes a lightweight GET /health request every N minutes.
 *   - The ping runs inside the same Node.js process — no external cron needed.
 *   - It is a SUPPLEMENT, not a replacement, for UptimeRobot (see README).
 *
 * WHY BOTH SELF-PING AND UPTIMEROBOT?
 *   - Self-ping keeps the instance warm as long as the process is alive.
 *   - UptimeRobot acts as a fallback: if the instance restarts or crashes,
 *     UptimeRobot's next ping will trigger a fresh cold start immediately,
 *     and subsequent self-pings keep it warm from there.
 *
 * CONFIGURATION (all optional):
 *   KEEP_ALIVE_URL       — Override the URL to ping (defaults to RENDER_EXTERNAL_URL + /health)
 *   KEEP_ALIVE_INTERVAL  — Ping interval in minutes (default: 5)
 *   DISABLE_KEEP_ALIVE   — Set to "true" to disable entirely
 */

/** @type {ReturnType<typeof setInterval> | null} */
let timer = null

/**
 * Start the keep-alive self-ping loop.
 * Safe to call multiple times — only one timer will be active.
 *
 * @param {{ port?: number }} [opts] - Options (port is used for logging only)
 */
export function startKeepAlive(opts = {}) {
  // Guard: don't start if explicitly disabled
  if (process.env.DISABLE_KEEP_ALIVE === 'true') {
    console.info('[keep-alive] Disabled via DISABLE_KEEP_ALIVE=true')
    return
  }

  // Guard: don't run a self-ping in development (local dev doesn't need it)
  if (process.env.NODE_ENV !== 'production') {
    console.info('[keep-alive] Skipped in non-production environment')
    return
  }

  // Determine the URL to ping
  const baseUrl =
    process.env.KEEP_ALIVE_URL ||
    (process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/health`
      : null)

  if (!baseUrl) {
    console.warn(
      '[keep-alive] No RENDER_EXTERNAL_URL or KEEP_ALIVE_URL set — cannot self-ping.',
      'Set one of these env vars or use UptimeRobot as the sole keep-alive mechanism.',
    )
    return
  }

  // Parse interval (default: 5 minutes)
  const intervalMinutes = Math.max(
    1,
    Math.min(14, Number(process.env.KEEP_ALIVE_INTERVAL) || 5),
  )
  const intervalMs = intervalMinutes * 60 * 1000

  // Prevent duplicate timers
  if (timer) {
    clearInterval(timer)
  }

  console.info(
    `[keep-alive] Pinging ${baseUrl} every ${intervalMinutes} min to prevent cold starts`,
  )

  timer = setInterval(async () => {
    try {
      // Use native fetch (Node 18+) — no extra dependency needed
      const res = await fetch(baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000), // 10-second timeout
      })
      if (res.ok) {
        console.info(`[keep-alive] Ping OK (${res.status})`)
      } else {
        console.warn(`[keep-alive] Ping returned ${res.status}`)
      }
    } catch (err) {
      // Log but don't crash — transient network issues are expected
      console.warn('[keep-alive] Ping failed:', err.message || err)
    }
  }, intervalMs)

  // Don't let the keep-alive timer prevent graceful shutdown
  timer.unref()
}

/**
 * Stop the keep-alive timer (e.g. during graceful shutdown or tests).
 */
export function stopKeepAlive() {
  if (timer) {
    clearInterval(timer)
    timer = null
    console.info('[keep-alive] Stopped')
  }
}
