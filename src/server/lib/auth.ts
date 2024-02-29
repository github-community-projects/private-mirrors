import { TRPCError } from '@trpc/server'
import { personalOctokit } from 'bot/octokit'
import { Middleware } from 'server/trpc'

export const verifyAuth: Middleware = async (opts) => {
  const { ctx } = opts

  if (!ctx.session?.user?.accessToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check validity of token
  const octokit = personalOctokit(ctx.session.user.accessToken)
  const user = await octokit.rest.users.getAuthenticated()

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx,
  })
}
