import { personalOctokit } from 'bot/octokit'
import { AuthOptions, Profile } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { logger } from '../../../../utils/logger'

import 'utils/proxy'

const authLogger = logger.getSubLogger({ name: 'auth' })

/**
 * Checks the session against the github API to see if the session is valid
 * @param token Token of the session
 * @returns boolean — Whether the session is valid
 */
export const verifySession = async (token: string | undefined) => {
  if (!token) return false

  const octokit = personalOctokit(token)
  try {
    await octokit.rest.users.getAuthenticated()
    return true
  } catch (error) {
    return false
  }
}

export const nextAuthOptions: AuthOptions = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'repo, user, read:org' },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  logger: {
    error(code, metadata) {
      if (!(metadata instanceof Error) && metadata.provider) {
        // redact the provider secret here
        delete metadata.provider
        authLogger.error({ code, metadata })
      } else {
        authLogger.error({ code, metadata })
      }
    },
    warn(code) {
      authLogger.warn({ code })
    },
    debug(code, metadata) {
      authLogger.debug({ code, metadata })
    },
  },
  callbacks: {
    signIn: async (params) => {
      authLogger.debug('Sign in callback')

      const profile = params.profile as Profile & { login?: string }
      const allowedHandles = (
        process.env.ALLOWED_HANDLES?.split(',') ?? []
      ).filter((handle) => handle !== '')

      if (allowedHandles.length === 0) {
        authLogger.info(
          'No allowed handles specified via ALLOWED_HANDLES, allowing all users.',
        )
        return true
      }

      if (!profile?.login) {
        return false
      }

      authLogger.debug('Trying to sign in with handle:', profile.login)

      if (allowedHandles.includes(profile.login)) {
        return true
      }

      authLogger.warn(
        `User "${profile.login}" is not in the allowed handles list`,
      )

      return false
    },
    session: async ({ session, token }) => {
      // TODO: Need to figure out how to do this more efficiently
      // Check if the user has a valid accessToken
      // const validSession = await verifySession(token?.accessToken as string);

      // if (!validSession) {
      //   return undefined as any;
      // }

      // This is fine when the session is invalid
      if (!token) {
        return undefined as any
      }

      // creates a new date that is 12 hours from now
      const twelveHoursFromNow = new Date(
        new Date().getTime() + 12 * 60 * 60 * 1000,
      )

      if (session.expires && new Date(session.expires) > twelveHoursFromNow) {
        session.expires = twelveHoursFromNow.toISOString()
      }

      return {
        ...session,
        user: { ...session.user, accessToken: token?.accessToken as string },
      }
    },
    // This type error is fine, we return undefined if the session is invalid
    jwt: async ({ token, account }) => {
      return {
        ...token,
        accessToken: token?.accessToken ?? account?.access_token,
      }
    },
  },
}
