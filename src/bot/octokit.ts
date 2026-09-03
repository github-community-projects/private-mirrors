import { createAppAuth } from '@octokit/auth-app'
import { request as octokitRequest } from '@octokit/request'
import { generatePKCS8Key } from 'utils/pem'
import { logger } from '../utils/logger'
import { Octokit } from './rest'
import { env } from '../../env.mjs'

export { personalOctokit } from './rest'

const appOctokitLogger = logger.getSubLogger({ name: 'app-octokit' })

const privateKey =
  env.PRIVATE_KEY &&
  !env.PRIVATE_KEY.includes('-----BEGIN RSA PRIVATE KEY-----')
    ? // Support optional base64 decoding of the private key to prevent issues with complicated environment variable passing scenarios
      Buffer.from(env.PRIVATE_KEY, 'base64').toString('utf8')
    : // Handle a bug with multiline envs in docker - See https://github.com/moby/moby/issues/46773
      (env.PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '')

/**
 * Generates an app access token for the app or an installation (if installationId is provided)
 * @param installationId An optional installation ID to generate an app access token for
 * @returns An access token for the app or installation
 */
export const generateAppAccessToken = async (installationId?: string) => {
  const convertedKey = generatePKCS8Key(privateKey)
  // Ensure auth requests target the configured (potentially GHE/GHES) API URL.
  const request = octokitRequest.defaults({ baseUrl: env.GITHUB_API_URL })

  if (installationId) {
    const auth = createAppAuth({
      appId: env.APP_ID,
      privateKey: convertedKey,
      installationId: installationId,
      request,
    })

    const appAuthentication = await auth({
      type: 'installation',
    })

    return appAuthentication.token
  }

  const auth = createAppAuth({
    appId: env.APP_ID,
    privateKey,
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    request,
  })

  const appAuthentication = await auth({
    type: 'app',
  })

  return appAuthentication.token
}

/**
 * Creates a new octokit instance that is authenticated as the app
 * @returns Octokit authorized as the app
 */
export const appOctokit = () => {
  const convertedKey = generatePKCS8Key(privateKey)

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.APP_ID,
      privateKey: convertedKey,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    log: appOctokitLogger,
    baseUrl: env.GITHUB_API_URL,
    githubGraphQlUrl: env.GITHUB_GRAPHQL_URL,
  })
}

/**
 * Creates a new octokit instance that is authenticated as the installation
 * @param installationId installation ID to authenticate as
 * @returns Octokit authorized as the installation
 */
export const installationOctokit = (installationId: string) => {
  const convertedKey = generatePKCS8Key(privateKey)

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.APP_ID,
      privateKey: convertedKey,
      installationId: installationId,
    },
    log: appOctokitLogger,
    baseUrl: env.GITHUB_API_URL,
    githubGraphQlUrl: env.GITHUB_GRAPHQL_URL,
  })
}

/**
 * Fetches octokit installations for both the contribution org and the private org
 * @param contributionOrgId Id of the contribution org
 * @param privateOrgId Id of the private org
 * @returns octokit instances for both the contribution and private orgs
 */
export const getAuthenticatedOctokit = async (
  contributionOrgId: string,
  privateOrgId: string,
) => {
  const contributionInstallationId =
    await appOctokit().rest.apps.getOrgInstallation({
      org: contributionOrgId,
    })

  const contributionAccessToken = await generateAppAccessToken(
    String(contributionInstallationId.data.id),
  )
  const contributionOctokit = installationOctokit(
    String(contributionInstallationId.data.id),
  )

  const privateInstallationId = await appOctokit().rest.apps.getOrgInstallation(
    {
      org: privateOrgId,
    },
  )

  const privateAccessToken = await generateAppAccessToken(
    String(privateInstallationId.data.id),
  )
  const privateOctokit = installationOctokit(
    String(privateInstallationId.data.id),
  )

  return {
    contribution: {
      accessToken: contributionAccessToken,
      octokit: contributionOctokit,
      installationId: String(contributionInstallationId.data.id),
    },
    private: {
      accessToken: privateAccessToken,
      octokit: privateOctokit,
      installationId: String(privateInstallationId.data.id),
    },
  }
}
