import { t } from '../../../utils/trpc-server'
import reposRouter from '../../../server/repos/router'
import octokitRouter from '../../../server/octokit/router'
import gitRouter from '../../../server/git/router'

export const healthCheckerRouter = t.router({
  healthchecker: t.procedure.query(({}) => {
    return {
      status: 'success',
      message: 'Welcome to trpc with Next.js 14 and React Query',
    }
  }),
})

export const appRouter = t.mergeRouters(
  reposRouter,
  octokitRouter,
  gitRouter,
  healthCheckerRouter,
)

export type AppRouter = typeof appRouter
