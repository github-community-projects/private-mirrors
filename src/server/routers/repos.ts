// This holds the elevated permissions to fetch data from the private org
import { getConfig } from 'bot/config'
import { appOctokit, installationOctokit, personalOctokit } from 'bot/octokit'
import { z } from 'zod'
import { procedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { groupBy, map, last } from 'underscore'

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

      // TODO: replace with a single search query+
      const reposWithProps = await octokit.rest.search.repos({
        q: `org:${privateOrgData.data.login} props.fork:"${publicOrgData.data.login}/${forkName}"`,
      })

      const reposWithDescription = await octokit.rest.search.repos({
        q: `org:${privateOrgData.data.login} in:description "mirror:${publicOrgData.data.login}/${forkName}"`,
      })

      const repos = map(
        groupBy(
          reposWithProps.data.items.concat(reposWithDescription.data.items),
          'id',
        ),
        last,
      )

      return repos as any[]
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

      const accessToken = opts.ctx.session?.user.accessToken

      if (!accessToken) {
        throw new Error('Unauthorized')
      }

      const userOctokit = await personalOctokit(accessToken)

      const fork = await userOctokit.rest.repos.get({
        owner: orgName,
        repo: mirrorName,
      })

      if (!fork.data) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to delete this mirror',
        })
      }

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
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete mirror',
          cause: e,
        })
      }

      return true
    }),
})
