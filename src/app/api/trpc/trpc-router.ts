import configRouter from 'server/config/router'
import gitRouter from '../../../server/git/router'
import octokitRouter from '../../../server/octokit/router'
import reposRouter from '../../../server/repos/router'
import { procedure, t } from '../../../utils/trpc-server'

export const healthCheckerRouter = t.router({
  healthChecker: procedure.query(() => {
    return 'ok'
  }),
})

export const appRouter = t.mergeRouters(
  reposRouter,
  octokitRouter,
  gitRouter,
  configRouter,
  healthCheckerRouter,
)

export type AppRouter = typeof appRouter
