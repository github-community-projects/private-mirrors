import { z } from 'zod'

export const CheckInstallationSchema = z.object({
  orgId: z.string(),
})

export type CheckInstallationSchema = z.TypeOf<typeof CheckInstallationSchema>
