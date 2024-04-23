import {
  checkGitHubAppInstallationAuth,
  checkGitHubAuth,
} from 'server/lib/auth'
import { Middleware } from 'server/trpc'

export const verifyAuth: Middleware = async (opts) => {
  const { ctx, rawInput, path } = opts

  if (path === 'git.syncRepos') {
    // Check app authentication
    checkGitHubAppInstallationAuth(
      (rawInput as Record<string, string>)?.accessToken,
      (rawInput as Record<string, string>)?.mirrorOwner,
      (rawInput as Record<string, string>)?.mirrorName,
    )

    return opts.next({
      ctx,
    })
  }

  // Verify valid github session
  checkGitHubAuth(
    ctx.session?.user?.accessToken,
    (rawInput as Record<string, string>)?.orgId, // Fetch orgId if there is one
  )

  return opts.next({
    ctx,
  })
}
