import { z } from 'zod'

export const SyncReposSchema = z.object({
  accessToken: z.string(),
  orgId: z.string(),
  destinationTo: z.enum(['mirror', 'fork']),
  forkOwner: z.string(),
  forkName: z.string(),
  mirrorName: z.string(),
  mirrorOwner: z.string(),
  mirrorBranchName: z.string(),
  forkBranchName: z.string(),
})

export const CreateMirrorSchema = z.object({
  orgId: z.string(),
  forkRepoOwner: z.string(),
  forkRepoName: z.string(),
  forkId: z.string(),
  newRepoName: z.string(),
  newBranchName: z.string(),
})

export type SyncReposSchema = z.TypeOf<typeof SyncReposSchema>
export type CreateMirrorSchema = z.TypeOf<typeof CreateMirrorSchema>
