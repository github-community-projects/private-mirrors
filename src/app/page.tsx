'use client'

import { Box } from '@primer/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { personalOctokit } from '../bot/octokit'
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

  return <Box>{!session.data?.user && <Login />}</Box>
}
