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
      // if orgs data is still loading, do nothing
      if (orgsData.isLoading) {
        return
      }

      // if user only has one org, go to that org's page
      if (orgsData.data?.length === 1) {
        router.push(`/${orgsData.data[0].login}`)
        return
      }

      // otherwise go to home page
      router.push('/')
    }
  }, [session.data?.user, orgsData.isLoading, orgsData.data, router])

  return <Box>{!session.data?.user && <Login />}</Box>
}

export default LoginPage
