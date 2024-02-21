// This holds the elevated permissions to fetch data from the private org
import { getConfig } from 'bot/config'
import { appOctokit, installationOctokit } from 'bot/octokit'
import { z } from 'zod'
import { procedure, router } from '../trpc'

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
        q: `org:${privateOrgData.data.login} in:description "mirror:${publicOrgData.data.login}/${forkName}"`,
      })

      return repos.data
    }),
})
