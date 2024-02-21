// This holds the elevated git permissions needed to run the app installation commands
import { appOctokit } from 'bot/octokit'
import { z } from 'zod'
import { procedure, router } from '../trpc'

export const octokitRouter = router({
  // Queries
  checkInstallation: procedure
    .input(
      z.object({
        orgId: z.string(),
      }),
    )
    .query(async (opts) => {
      const { orgId } = opts.input

      try {
        const installationId = await appOctokit().rest.apps.getOrgInstallation({
          org: orgId,
        })

        if (installationId.data.id) {
          return { installed: true }
        }

        return { installed: false }
      } catch (e) {
        return { installed: false }
      }
    }),
})
