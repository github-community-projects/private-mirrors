import { checkGitHubAppInstallationAuth, checkGitHubAuth } from './auth'
import { Middleware } from './trpc-server'

export const verifyGitHubAppAuth: Middleware = async (opts) => {
  const { ctx, rawInput } = opts

  // Check app authentication
  await checkGitHubAppInstallationAuth(
    (rawInput as Record<string, string>)?.accessToken,
    (rawInput as Record<string, string>)?.mirrorOwner,
    (rawInput as Record<string, string>)?.mirrorName,
  )

  return opts.next({
    ctx,
  })
}

export const verifyAuth: Middleware = async (opts) => {
  const { ctx, rawInput } = opts

  // Verify valid github session
  await checkGitHubAuth(
    ctx.session?.user?.accessToken,
    (rawInput as Record<string, string>)?.orgId, // Fetch orgId if there is one
  )

  return opts.next({
    ctx,
  })
}
