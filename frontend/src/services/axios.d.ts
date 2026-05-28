import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Do not auto-retry on network / gateway errors. */
    skipRetry?: boolean
    /** Allow duplicate in-flight requests with the same key. */
    skipDedup?: boolean
    /** @internal Retry count for cold-start recovery. */
    _retryCount?: number
    /** @internal Joined an existing in-flight deduplicated request. */
    _dedupJoined?: boolean
  }

  export interface InternalAxiosRequestConfig {
    skipRetry?: boolean
    skipDedup?: boolean
    _retryCount?: number
    _dedupJoined?: boolean
  }
}
