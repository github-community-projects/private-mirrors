// This holds the elevated permissions to fetch data from the private org
import { TRPCError } from '@trpc/server'
import { getConfig } from 'bot/config'
import { appOctokit, installationOctokit } from 'bot/octokit'
import { logger } from 'utils/logger'
import { z } from 'zod'
import { procedure, router } from '../trpc'

const reposApiLogger = logger.getSubLogger({ name: 'repos-api' })

export const reposRouter = router({
  // Queries
  listMirrors: procedure
    .input(
      z.object({
        orgId: z.string(),
        forkName: z.string(),
      }),
    )
    .query(async (opts) => {
      const { orgId, forkName } = opts.input

      const config = await getConfig(orgId)

      const installationId = await appOctokit().rest.apps.getOrgInstallation({
        org: config.privateOrg,
      })

      const octokit = installationOctokit(String(installationId.data.id))

      const privateOrgData = await octokit.rest.orgs.get({
        org: config.privateOrg,
      })
      const publicOrgData = await octokit.rest.orgs.get({ org: orgId })

      const repos = await octokit.rest.search.repos({
        q: `org:"${privateOrgData.data.login}"+props.fork:"${publicOrgData.data.login}/${forkName}" org:"${privateOrgData.data.login}"&mirror:"${publicOrgData.data.login}/${forkName}"+in:description`,
      })

      return repos.data.items
    }),

  deleteMirror: procedure
    .input(
      z.object({
        orgId: z.string(),
        orgName: z.string(),
        mirrorName: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { orgId, orgName, mirrorName } = opts.input
      reposApiLogger.info('Deleting mirror', { orgId, orgName, mirrorName })

      const config = await getConfig(orgId)

      const installationId = await appOctokit().rest.apps.getOrgInstallation({
        org: config.privateOrg,
      })

      const octokit = installationOctokit(String(installationId.data.id))

      try {
        await octokit.rest.repos.delete({
          owner: config.privateOrg,
          repo: mirrorName,
        })
      } catch (error) {
        reposApiLogger.error('Failed to delete mirror', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete mirror',
          cause: error,
        })
      }

      return true
    }),
})
