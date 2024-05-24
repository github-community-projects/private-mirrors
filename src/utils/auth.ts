import { TRPCError } from '@trpc/server'
import { getConfig } from '../bot/config'
import { personalOctokit } from '../bot/octokit'
import { logger } from '../utils/logger'

/**
 * Generates a git url with the access token in it
 * @param accessToken Access token for the app
 * @param owner Repo Owner
 * @param repo Repo Name
 * @returns formatted authenticated git url
 */
export const generateAuthUrl = (
  accessToken: string,
  owner: string,
  repo: string,
) => {
  const USER = 'x-access-token'
  const PASS = accessToken
  const REPO = `github.com/${owner}/${repo}`
  return `https://${USER}:${PASS}@${REPO}`
}

const middlewareLogger = logger.getSubLogger({ name: 'middleware' })

/**
 * Checks if the access token has access to the mirror org and repo
 *
 * Used for checking if the git.syncRepos mutation has the correct permissions
 * @param accessToken Access token for the private org's installation
 * @param mirrorOrgOwner Mirror org owner
 * @param mirrorRepo Mirror repo name
 */
export const checkGitHubAppInstallationAuth = async (
  accessToken: string | undefined,
  mirrorOrgOwner: string | undefined,
  mirrorRepo: string | undefined,
) => {
  if (!accessToken || !mirrorOrgOwner || !mirrorRepo) {
    middlewareLogger.error('No access token or mirror org/repo provided')
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const octokit = personalOctokit(accessToken)

  const data = await octokit.rest.repos.get({
    owner: mirrorOrgOwner,
    repo: mirrorRepo,
  })

  if (!data.data) {
    middlewareLogger.error('App does not have access to mirror repo')
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
}

/**
 * Checks to see if the user has access to the organization
 * @param accessToken Access token for a user
 */
export const checkGitHubAuth = async (
  accessToken: string | undefined,
  orgId: string | undefined,
) => {
  if (!accessToken) {
    middlewareLogger.error('No access token provided')
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const octokit = personalOctokit(accessToken)

  try {
    // Check validity of token
    const user = await octokit.rest.users.getAuthenticated()
    if (!user) {
      middlewareLogger.error('No user found')
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // Check if user has access to the org
    if (orgId) {
      const config = await getConfig(orgId)

      const org = await octokit.rest.orgs.getMembershipForAuthenticatedUser({
        org: config.publicOrg,
      })

      if (!org.data) {
        middlewareLogger.error('User does not have access to org')
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
    }
  } catch (error) {
    middlewareLogger.error('Error checking github auth', error)
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
}
