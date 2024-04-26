'use client'

import { Box } from '@primer/react'
import Login from 'app/components/Login'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const session = useSession()
  const router = useRouter()

  if (session.data?.user) {
    router.push('/')
  }

  return <Box>{!session.data?.user && <Login />}</Box>
}
