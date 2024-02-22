import { router } from '../trpc'
import { gitRouter } from './git'
import { octokitRouter } from './octokit'
import { reposRouter } from './repos'

export const appRouter = router({
  git: gitRouter,
  octokit: octokitRouter,
  repos: reposRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
