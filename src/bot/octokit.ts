import { createAppAuth } from '@octokit/auth-app'
import { logger } from 'utils/logger'
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
  if (installationId) {
    const auth = createAppAuth({
      appId: process.env.APP_ID!,
      privateKey: privateKey,
      installationId: installationId,
    })

    const appAuthentication = await auth({
      type: 'installation',
    })

    return appAuthentication.token
  }

  const auth = createAppAuth({
    appId: process.env.APP_ID!,
    privateKey: privateKey,
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
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.APP_ID!,
      privateKey: privateKey,
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
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.APP_ID!,
      privateKey: privateKey,
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
