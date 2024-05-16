'use client'

import { Box } from '@primer/react'
import Login from 'app/components/Login'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session.data?.user) {
      router.push('/')
    }
  }, [session, router])

  return <Box>{!session.data?.user && <Login />}</Box>
}
