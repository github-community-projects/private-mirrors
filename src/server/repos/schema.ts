import { z } from 'zod'

export const CreateMirrorSchema = z.object({
  orgId: z.string(),
  forkRepoOwner: z.string(),
  forkRepoName: z.string(),
  forkId: z.string(),
  newRepoName: z.string(),
  newBranchName: z.string(),
})

export const ListMirrorsSchema = z.object({
  orgId: z.string(),
  forkName: z.string(),
})

export const DeleteMirrorSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  mirrorName: z.string(),
})

export type CreateMirrorSchema = z.TypeOf<typeof CreateMirrorSchema>
export type ListMirrorsSchema = z.TypeOf<typeof ListMirrorsSchema>
export type DeleteMirrorSchema = z.TypeOf<typeof DeleteMirrorSchema>
