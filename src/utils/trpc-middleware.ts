import { checkGitHubAppInstallationAuth, checkGitHubAuth } from './auth'
import { Middleware } from './trpc-server'

// Middleware runs before input validation, so read the raw input
const getInput = async (opts: { getRawInput: () => Promise<unknown> }) =>
  (await opts.getRawInput()) as Record<string, string> | undefined

export const verifyGitHubAppAuth: Middleware = async (opts) => {
  const input = await getInput(opts)

  // Check app authentication
  await checkGitHubAppInstallationAuth(
    input?.accessToken,
    input?.mirrorOwner,
    input?.mirrorName,
  )

  return opts.next({ ctx: opts.ctx })
}

export const verifyAuth: Middleware = async (opts) => {
  const input = await getInput(opts)

  // Verify valid github session
  await checkGitHubAuth(opts.ctx.session?.user?.accessToken, input?.orgId)

  return opts.next({ ctx: opts.ctx })
}
