import { router } from '../trpc'
import { gitRouter } from './git'
import { healthRouter } from './health'
import { octokitRouter } from './octokit'
import { reposRouter } from './repos'

export const appRouter = router({
  git: gitRouter,
  octokit: octokitRouter,
  repos: reposRouter,
  health: healthRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
