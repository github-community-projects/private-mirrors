'use client'

import { SessionProvider, signOut, useSession } from 'next-auth/react'

import { ReactNode, useEffect } from 'react'

const VerifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  const session = useSession()

  console.log('session', session)

  // sign user out if session is expired
  useEffect(() => {
    if (!session || session.status === 'loading') {
      return
    }

    if (session.data && new Date(session.data.expires) < new Date()) {
      signOut()
    }
  }, [session, session.status, session.data, session.data?.expires])

  return children
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <VerifiedAuthProvider>{children}</VerifiedAuthProvider>
    </SessionProvider>
  )
}
