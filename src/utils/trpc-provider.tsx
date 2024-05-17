'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getFetch, httpBatchLink, loggerLink } from '@trpc/client'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import superjson from 'superjson'
import queryClient from './query-client'
import { trpc } from './trpc'

const getBaseUrl = () => {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return ''
  if (process.env.VERCEL_URL)
    // reference for vercel.com deployments
    return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXTAUTH_URL)
    // reference for non-vercel providers
    return process.env.NEXTAUTH_URL
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}

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
