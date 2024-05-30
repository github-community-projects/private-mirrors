import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    error?: 'RefreshAccessTokenError'
    user: {
      accessToken: string | undefined
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    accessTokenExpires: number
    refreshToken: string
    refreshTokenExpires: number
    error?: 'RefreshAccessTokenError'
  }
}

export { Session }
