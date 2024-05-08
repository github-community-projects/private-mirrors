import gitRouter from '../../../server/git/router'
import octokitRouter from '../../../server/octokit/router'
import reposRouter from '../../../server/repos/router'
import { t, procedure } from '../../../utils/trpc-server'

export const healthCheckerRouter = t.router({
  healthchecker: procedure.query(({}) => {
    return 'ok'
  }),
})

export const appRouter = t.mergeRouters(
  reposRouter,
  octokitRouter,
  gitRouter,
  healthCheckerRouter,
)

export type AppRouter = typeof appRouter
