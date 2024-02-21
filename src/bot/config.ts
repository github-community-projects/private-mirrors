import { Configuration } from '@probot/octokit-plugin-config/dist-types/types'
import { logger } from 'utils/logger'
import z from 'zod'
import { appOctokit, installationOctokit } from './octokit'

const configLogger = logger.getSubLogger({ name: 'config' })

const internalContributionForksConfig = z.object({
  publicOrg: z.string(),
  privateOrg: z.string(),
})

type InternalContributionForksConfig = z.infer<
  typeof internalContributionForksConfig
> &
  Configuration

export const getGitHubConfig = async (orgId: string) => {
  const installationId = await appOctokit().rest.apps.getOrgInstallation({
    org: orgId,
  })
  const octokit = installationOctokit(String(installationId.data.id))

  const orgData = await octokit.rest.orgs.get({ org: orgId })

  const config = await octokit.config.get<InternalContributionForksConfig>({
    owner: orgData.data.login,
    repo: '.github',
    path: 'internal-contribution-forks/config.yml',
  })

  const found = Boolean(config.files[0].config)

  if (!found) {
    configLogger.warn(
      `No config found for org, using default org: '${orgId}' for BOTH public and private!`,
    )
    return {
      publicOrg: orgId,
      privateOrg: orgId,
    }
  }

  return config.config
}

export const getEnvConfig = () => {
  if (!process.env.PUBLIC_ORG) {
    return null
  }

  const config = {
    publicOrg: process.env.PUBLIC_ORG as string,
    privateOrg: process.env.PUBLIC_ORG as string,
  } as InternalContributionForksConfig

  if (process.env.PRIVATE_ORG) {
    config.privateOrg = process.env.PRIVATE_ORG
  }
  return config
}

export const validateConfig = (config: InternalContributionForksConfig) => {
  try {
    internalContributionForksConfig.parse(config)
  } catch (e) {
    configLogger.error('Invalid config found!')
    configLogger.error(e)
    throw new Error(
      'Invalid config found! Please check the config and error log for more details.',
    )
  }

  return config
}

/**
 * Fetches a configuration file from the organization's .github repository
 * @param orgId Organization ID
 * @returns Configuration file
 */
export const getConfig = async (orgId?: string) => {
  let config: InternalContributionForksConfig | null = null

  // First check for environment variables
  config = getEnvConfig()
  if (config) {
    return validateConfig(config)
  }

  // Lastly check github for a config
  if (!orgId) {
    logger.error(
      'No orgId present, Organization ID is required to fetch a config when not using environment variables',
    )
    throw new Error('Organization ID is required to fetch a config!')
  }

  config = await getGitHubConfig(orgId)
  return validateConfig(config)
}
