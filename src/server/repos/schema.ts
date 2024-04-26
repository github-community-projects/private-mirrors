import { z } from 'zod'

export const ListMirrorsSchema = z.object({
  orgId: z.string(),
  forkName: z.string(),
})

export const DeleteMirrorSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  mirrorName: z.string(),
})

export type ListMirrorsSchema = z.TypeOf<typeof ListMirrorsSchema>
export type DeleteMirrorSchema = z.TypeOf<typeof DeleteMirrorSchema>
