import { z } from 'zod'

export const mirrorNameSchema = z
  .string()
  .min(1, 'Mirror name is required')
  .max(100, 'Mirror name cannot exceed 100 characters')
  .regex(
    /^[A-Za-z0-9._-]+$/,
    'Only letters, numbers, hyphens, underscores, and periods are allowed',
  )
  .refine((name) => name !== '.' && name !== '..', {
    message: 'Mirror name cannot be "." or ".."',
  })
  .refine((name) => !name.toLowerCase().endsWith('.git'), {
    message: 'Mirror name cannot end with ".git"',
  })

export const CreateMirrorSchema = z.object({
  orgId: z.string(),
  forkRepoOwner: z.string(),
  forkRepoName: z.string(),
  forkId: z.string(),
  newRepoName: mirrorNameSchema,
})

export const ListMirrorsSchema = z.object({
  orgId: z.string(),
  forkName: z.string(),
})

export const EditMirrorSchema = z.object({
  orgId: z.string(),
  mirrorName: z.string(),
  newMirrorName: mirrorNameSchema,
})

export const DeleteMirrorSchema = z.object({
  orgId: z.string(),
  mirrorName: z.string(),
})

export type CreateMirrorSchema = z.TypeOf<typeof CreateMirrorSchema>
export type ListMirrorsSchema = z.TypeOf<typeof ListMirrorsSchema>
export type EditMirrorSchema = z.TypeOf<typeof EditMirrorSchema>
export type DeleteMirrorSchema = z.TypeOf<typeof DeleteMirrorSchema>
