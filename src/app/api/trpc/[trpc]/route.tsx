import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from '@trpc/server/adapters/fetch'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from '../../auth/lib/nextauth-options'
import { appRouter } from '../trpc-router'

const createContext = async ({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) => {
  const session = await getServerSession(nextAuthOptions)

  return { req, resHeaders, session }
}

const handler = (request: Request) => {
  console.log(`incoming request ${request.url}`)
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext,
  })
}

export { handler as GET, handler as POST }
