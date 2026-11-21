import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../app/api/trpc/trpc-router'

export const getBaseUrl = () => {
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

export const trpc = createTRPCReact<AppRouter>()
