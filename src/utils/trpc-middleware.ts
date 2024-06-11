import { TRPCError } from '@trpc/server'
import { checkGitHubAppInstallationAuth, checkGitHubAuth } from './auth'
import { Middleware } from './trpc-server'

export const verifyGitHubAppAuth: Middleware = async (opts) => {
  const { ctx, rawInput } = opts

  // Check app authentication
  try {
    await checkGitHubAppInstallationAuth(
      (rawInput as Record<string, string>)?.accessToken,
      (rawInput as Record<string, string>)?.mirrorOwner,
      (rawInput as Record<string, string>)?.mirrorName,
    )

    return opts.next({
      ctx,
    })
  } catch (error) {
    console.error('Error checking github app installation auth', error)
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
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
