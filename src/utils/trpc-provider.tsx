'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, getFetch, loggerLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './trpc'
import queryClient from './query-client'

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const url = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000/api/trpc/'

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url,
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
