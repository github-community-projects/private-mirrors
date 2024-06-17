import { z } from 'zod'

export const GetConfigSchema = z.object({
  orgId: z.string(),
})

export type GetConfigSchema = z.TypeOf<typeof GetConfigSchema>
