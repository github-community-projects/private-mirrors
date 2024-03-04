import { TRPCError } from '@trpc/server'
import { personalOctokit } from 'bot/octokit'
import { logger } from 'utils/logger'

const middlewareLogger = logger.getSubLogger({ name: 'middleware' })

export const checkGitHubAuth = async (accessToken: string | undefined) => {
  if (!accessToken) {
    middlewareLogger.error('No access token provided')
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check validity of token
  const octokit = personalOctokit(accessToken)
  try {
    const user = await octokit.rest.users.getAuthenticated()
    if (!user) {
      middlewareLogger.error('No user found')
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
  } catch (error) {
    middlewareLogger.error('Error checking github auth', error)
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
}
