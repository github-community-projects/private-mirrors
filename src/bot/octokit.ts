import { createAppAuth } from '@octokit/auth-app'
import { generatePKCS8Key } from 'utils/pem'
import { logger } from '../utils/logger'
import { Octokit } from './rest'

const personalOctokitLogger = logger.getSubLogger({ name: 'personal-octokit' })
const appOctokitLogger = logger.getSubLogger({ name: 'app-octokit' })

// This is a bug with the way the private key is stored in the docker env
// See https://github.com/moby/moby/issues/46773
let privateKey = process.env.PRIVATE_KEY?.includes('\\n')
  ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
  : process.env.PRIVATE_KEY!

/**
 * Generates an app access token for the app or an installation (if installationId is provided)
 * @param installationId An optional installation ID to generate an app access token for
 * @returns An access token for the app or installation
 */
export const generateAppAccessToken = async (installationId?: string) => {
  const convertedKey = generatePKCS8Key(privateKey)

  if (installationId) {
    const auth = createAppAuth({
      appId: process.env.APP_ID!,
      privateKey: convertedKey,
      installationId: installationId,
    })

    const appAuthentication = await auth({
      type: 'installation',
    })

    return appAuthentication.token
  }

  const auth = createAppAuth({
    appId: process.env.APP_ID!,
    privateKey,
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
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
      appId: process.env.APP_ID!,
      privateKey: convertedKey,
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    },
    log: appOctokitLogger,
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
      appId: process.env.APP_ID!,
      privateKey: convertedKey,
      installationId: installationId,
    },
    log: appOctokitLogger,
  })
}

/**
 * Creates a new octokit instance that is authenticated as the user
 * @param token personal access token
 * @returns Octokit authorized with the personal access token
 */
export const personalOctokit = (token: string) => {
  return new Octokit({
    auth: token,
    log: personalOctokitLogger,
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
