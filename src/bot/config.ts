import { Configuration } from '@probot/octokit-plugin-config/dist-types/types'
import z from 'zod'
import { logger } from '../utils/logger'
import { appOctokit, installationOctokit } from './octokit'

const configLogger = logger.getSubLogger({ name: 'config' })

const pmaConfig = z.object({
  publicOrg: z.string(),
  privateOrg: z.string(),
})

type pmaConfig = z.infer<typeof pmaConfig> & Configuration

export const getGitHubConfig = async (orgId: string) => {
  const installationId = await appOctokit().rest.apps.getOrgInstallation({
    org: orgId,
  })
  const octokit = installationOctokit(String(installationId.data.id))

  const orgData = await octokit.rest.orgs.get({ org: orgId })

  configLogger.info(
    `No config found for org, using default org: '${orgData.data.login}' for BOTH public and private!`,
  )
  return {
    publicOrg: orgData.data.login,
    privateOrg: orgData.data.login,
  }
}

export const getEnvConfig = () => {
  if (!process.env.PUBLIC_ORG) {
    return null
  }

  configLogger.info(
    `PUBLIC_ORG is set. Using config from environment variables!`,
  )

  const config = {
    publicOrg: process.env.PUBLIC_ORG,
    privateOrg: process.env.PUBLIC_ORG,
  } as pmaConfig

  if (process.env.PRIVATE_ORG) {
    config.privateOrg = process.env.PRIVATE_ORG
  }
  return config
}

export const validateConfig = (config: pmaConfig) => {
  try {
    pmaConfig.parse(config)
  } catch (error) {
    configLogger.error('Invalid config found!', { error })
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
  let config: pmaConfig | null = null

  // First check for environment variables
  config = getEnvConfig()
  if (config) {
    return validateConfig(config)
  }

  // Lastly check github for a config
  if (!orgId) {
    configLogger.error(
      'No orgId present, Organization ID is required to set a config when not using environment variables',
    )
    throw new Error('Organization ID is required to set a config!')
  }

  config = await getGitHubConfig(orgId)

  configLogger.info(`Using following config values`, {
    config,
  })

  return validateConfig(config)
}
