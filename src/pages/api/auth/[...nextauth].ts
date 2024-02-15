import { personalOctokit } from 'bot/octokit'
import NextAuth, { AuthOptions } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { logger } from '../../../utils/logger'

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
    session: async ({ session, token }) => {
      authLogger.debug('Session callback')

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

      return {
        ...session,
        user: { ...session.user, accessToken: token?.accessToken as string },
      }
    },
    // This type error is fine, we return undefined if the session is invalid
    jwt: async ({ token, account }) => {
      authLogger.debug('JWT callback')

      return {
        ...token,
        accessToken: token?.accessToken ?? account?.access_token,
      }
    },
  },
}

export default NextAuth(nextAuthOptions)
