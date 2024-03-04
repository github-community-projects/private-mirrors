import { checkGitHubAuth } from 'server/lib/auth'
import { Middleware } from 'server/trpc'

export const verifyAuth: Middleware = async (opts) => {
  const { ctx } = opts

  // Verify valid github session
  checkGitHubAuth(ctx.session?.user?.accessToken)

  return opts.next({
    ctx,
  })
}
