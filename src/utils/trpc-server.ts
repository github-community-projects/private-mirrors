import { initTRPC } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from '../app/api/auth/lib/nextauth-options'
import { verifyAuth } from '../utils/trpc-middleware'

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, nextAuthOptions)

  return {
    session,
  }
}

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
export const t = initTRPC.context<typeof createContext>().create({})

// Base router and procedure helpers
export const router = t.router
export type Middleware = Parameters<(typeof t.procedure)['use']>[0]
export const procedure = t.procedure.use(verifyAuth)
