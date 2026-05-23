import { useState, type ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryClient, shouldPersistSurveyQuery } from '../lib/queryClient'
import { SURVEY_CACHE_ROOT } from '../lib/queryKeys'

const PERSIST_KEY = 'survey-react-query-cache'
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

function createPersister() {
  if (typeof window === 'undefined') return undefined
  try {
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: PERSIST_KEY,
    })
  } catch {
    return undefined
  }
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [persister] = useState(createPersister)

  if (!persister) {
    return <>{children}</>
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (!shouldPersistSurveyQuery(query)) return false
            return query.state.status === 'success'
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}

export function clearSurveyQueryCache() {
  queryClient.clear()
  try {
    localStorage.removeItem(PERSIST_KEY)
  } catch {
    /* ignore */
  }
  void SURVEY_CACHE_ROOT
}
