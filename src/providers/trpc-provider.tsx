'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import {
  createTRPCClient,
  getFetch,
  httpBatchLink,
  loggerLink,
} from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import queryClient from '../utils/query-client'
import type { AppRouter } from '../app/api/trpc/trpc-router'
import { getBaseUrl, TRPCProvider } from '../utils/trpc'

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          fetch: async (input, init?) => {
            const fetch = getFetch()
            return fetch(input, {
              ...init,
              credentials: 'include',
            })
          },
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
