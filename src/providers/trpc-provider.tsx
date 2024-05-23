'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getFetch, httpBatchLink, loggerLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import queryClient from '../utils/query-client'
import { getBaseUrl, trpc } from '../utils/trpc'

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          fetch: async (input, init?) => {
            const fetch = getFetch()
            return fetch(input, {
              ...init,
              credentials: 'include',
            })
          },
        }),
      ],
      transformer: superjson,
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
