import mongoose from 'mongoose'
import { stopKeepAlive } from '../services/keepAlive.js'

/**
 * Connect to MongoDB with production-tuned pool settings.
 * Mongoose handles reconnection automatically via its internal driver,
 * but we log state changes for operational visibility.
 */
export async function connectMongo(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 15_000,
  })

  const conn = mongoose.connection

  // ─── Connection lifecycle events (for operational logging) ──────────
  conn.on('error', (err) => {
    console.error('[mongo] Connection error:', err.message || err)
  })

  conn.on('disconnected', () => {
    console.warn('[mongo] Disconnected — mongoose will attempt automatic reconnection')
  })

  conn.on('reconnected', () => {
    console.info('[mongo] Reconnected successfully')
  })

  return conn
}

/**
 * Register OS signal handlers for graceful MongoDB shutdown.
 * Also stops the keep-alive timer so the process can exit cleanly.
 */
export function registerMongoShutdownHandlers() {
  const shutdown = async (signal) => {
    try {
      stopKeepAlive()
      await mongoose.connection.close()
      console.info(`[mongo] Disconnected (${signal})`)
    } catch (err) {
      console.error('[mongo] Error closing connection:', err)
    }
    process.exit(0)
  }
  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}
