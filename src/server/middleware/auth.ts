import { checkGitHubAuth } from 'server/lib/auth'
import { Middleware } from 'server/trpc'

export const verifyAuth: Middleware = async (opts) => {
  const { ctx } = opts

  // Check validity of token
  checkGitHubAuth(ctx.session?.user?.accessToken)

  return opts.next({
    ctx,
  })
}
