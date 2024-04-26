'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { personalOctokit } from '../bot/octokit'
import { Box } from '@primer/react'
import Login from './components/Login'

export default function Home() {
  const router = useRouter()
  const session = useSession()
  const [organizations, setOrganizations] = useState<
    Awaited<ReturnType<typeof getAllOrganizations>>
  >([])

  const getAllOrganizations = async (accessToken: string) => {
    const octokit = personalOctokit(accessToken)
    const data = await octokit.rest.orgs.listForAuthenticatedUser()
    return data.data
  }

  useEffect(() => {
    if (session.data?.user) {
      const { accessToken } = session.data.user ?? {}
      if (!accessToken) {
        return
      }

      getAllOrganizations(accessToken).then((orgs) => {
        router.push(`/${orgs[0].login}`)

        setOrganizations(orgs)
      })
    }
  }, [session, router, session.data?.user])

  // TODO: Avoid flashing the login screen
  return <Box>{!session.data?.user && <Login />}</Box>
}
