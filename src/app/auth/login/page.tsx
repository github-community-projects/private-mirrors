'use client'

import { Box } from '@primer/react'
import { Login } from 'app/components/login/Login'
import { useOrgsData } from 'hooks/useOrganizations'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LoginPage = () => {
  const session = useSession()
  const orgsData = useOrgsData()

  const router = useRouter()

  useEffect(() => {
    if (session.data?.user) {
      // redirect to org page if user has only one org
      if (orgsData && orgsData.length === 1) {
        router.push(`/${orgsData[0].login}`)
      }

      // otherwise go to home page
      router.push('/')
    }
  }, [session, orgsData, router])

  return <Box>{!session.data?.user && <Login />}</Box>
}

export default LoginPage
