import { Octokit } from 'bot/rest'
import { z } from 'zod'

export const SyncReposSchema = z.object({
  source: z.object({
    org: z.string(),
    repo: z.string(),
    branch: z.string(),
    octokit: z.object({
      accessToken: z.string(),
      octokit: z.instanceof(Octokit),
      installationId: z.string(),
    }),
  }),
  destination: z.object({
    org: z.string(),
    repo: z.string(),
    branch: z.string(),
    octokit: z.object({
      accessToken: z.string(),
      octokit: z.instanceof(Octokit),
      installationId: z.string(),
    }),
  }),
  removeHeadMergeCommit: z.boolean(),
})

export type SyncReposSchema = z.TypeOf<typeof SyncReposSchema>
