'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getFetch, httpBatchLink, loggerLink } from '@trpc/client'
import { useEffect, useState } from 'react'
import superjson from 'superjson'
import queryClient from './query-client'
import { trpc } from './trpc'
import { signOut, useSession } from 'next-auth/react'

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
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

  const session = useSession()

  // sign user out if session is expired
  useEffect(() => {
    if (
      !session ||
      !session.data ||
      new Date(session.data.expires) < new Date()
    ) {
      signOut()
    }
  }, [session])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
