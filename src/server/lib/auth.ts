import { TRPCError } from '@trpc/server'
import { personalOctokit } from 'bot/octokit'

export const checkGitHubAuth = async (accessToken: string | undefined) => {
  if (!accessToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check validity of token
  const octokit = personalOctokit(accessToken)
  const user = await octokit.rest.users.getAuthenticated()

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
}
