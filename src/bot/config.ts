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

/**
 * Fetches a configuration file from the organization's .github repository
 * @param orgId Organization ID
 * @returns Configuration file
 */
export const getConfig = async (orgId?: string) => {
  // First check if there's a config file in the environment
  if (process.env.config) {
    configLogger.info('Using config from environment')
    try {
      const config = internalContributionForksConfig.parse(
        JSON.parse(process.env.config),
      )
      return config
    } catch (e) {
      configLogger.error('Invalid config found in environment!')
      configLogger.error(e)
      throw new Error(
        'Invalid config found in environment! Please check the config file and error log for more details.',
      )
    }
  }

  // Fallback to pull from the .github repository if no orgId is provided

  if (!orgId) {
    logger.error(
      'No orgId present, Organization ID is required to fetch a config when not using environment variables',
    )
    throw new Error('Organization ID is required to fetch a config!')
  }

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

  // Make sure config is valid
  configLogger.info(`Found config file! Validating config for org: '${orgId}'`)
  try {
    internalContributionForksConfig.parse(config.config)
    configLogger.info(`Config for org: '${orgId}' is valid!`)
  } catch (e) {
    configLogger.error(`Invalid config found for org: '${orgId}'!`)
    configLogger.error(e)
    throw new Error(
      'Invalid config found! Please check the config file and error log for more details.',
    )
  }

  return config.config
}
