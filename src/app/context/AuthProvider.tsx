 
'use client'

import { Session } from 'next-auth'
import { SessionProvider, signOut, useSession } from 'next-auth/react'

import { ReactNode, useEffect } from 'react'
import { logger } from 'utils/logger'

const authProviderLogger = logger.getSubLogger({ name: 'auth-provider' })

const VerifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  const session = useSession()

  // sign user out if session is expired
  useEffect(() => {
    if (!session || session.status === 'loading') {
      return
    }

    if (session.data?.error === 'RefreshAccessTokenError') {
      authProviderLogger.error('Could not refresh access token - signing out')
      signOut()
    }

    if (session.data && new Date(session.data.expires) < new Date()) {
      authProviderLogger.info('session expired - signing out')
      signOut()
    }
  }, [
    session,
    session.status,
    session.data,
    session.data?.error,
    session.data?.expires,
  ])

  return children
}

export const AuthProvider = ({
  children,
  session,
}: {
  children: ReactNode
  session: Session | null
}) => {
  return (
    <SessionProvider session={session}>
      <VerifiedAuthProvider>{children}</VerifiedAuthProvider>
    </SessionProvider>
  )
}
