import { TRPCError } from '@trpc/server'
import { getConfig } from '../../bot/config'
import { appOctokit, installationOctokit } from '../../bot/octokit'
import { logger } from '../../utils/logger'
import { ListMirrorsSchema } from './schema'

const reposApiLogger = logger.getSubLogger({ name: 'repos-api' })

export const listMirrorsHandler = async ({
  input,
}: {
  input: ListMirrorsSchema
}) => {
  try {
    reposApiLogger.info('Fetching mirrors', { input })

    const config = await getConfig(input.orgId)

    const installationId = await appOctokit().rest.apps.getOrgInstallation({
      org: config.privateOrg,
    })

    const octokit = installationOctokit(String(installationId.data.id))

    const privateOrgData = await octokit.rest.orgs.get({
      org: config.privateOrg,
    })
    const publicOrgData = await octokit.rest.orgs.get({ org: input.orgId })

    const repos = await octokit.rest.search.repos({
      q: `org:"${privateOrgData.data.login}"+props.fork:"${publicOrgData.data.login}/${input.forkName}" org:"${privateOrgData.data.login}"&mirror:"${publicOrgData.data.login}/${input.forkName}"+in:description`,
    })

    return repos.data.items
  } catch (error) {
    reposApiLogger.info('Failed to fetch mirrors', { input, error })

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch mirrors',
      cause: error,
    })
  }
}

export const deleteMirrorHandler = async ({
  input,
}: {
  input: {
    orgId: string
    orgName: string
    mirrorName: string
  }
}) => {
  try {
    reposApiLogger.info('Deleting mirror', { input })

    const config = await getConfig(input.orgId)

    const installationId = await appOctokit().rest.apps.getOrgInstallation({
      org: config.privateOrg,
    })

    const octokit = installationOctokit(String(installationId.data.id))

    await octokit.rest.repos.delete({
      owner: config.privateOrg,
      repo: input.mirrorName,
    })

    return true
  } catch (error) {
    reposApiLogger.error('Failed to delete mirror', { input, error })

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete mirror',
      cause: error,
    })
  }
}
