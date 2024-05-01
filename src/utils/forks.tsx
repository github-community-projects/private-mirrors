import { Organization, Repository } from '@octokit/graphql-schema'
import { getReposInOrgGQL } from 'bot/graphql'
import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useOrgData } from './organization'
import { useParams } from 'next/navigation'

const getForksInOrg = async (accessToken: string, login: string) => {
  const res = await personalOctokit(accessToken).graphql<{
    organization: Organization
  }>(getReposInOrgGQL, {
    login,
  })

  return res.organization.repositories
}

export function useForksData() {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}

  const orgData = useOrgData()

  const [forks, setForks] = useState<Awaited<
    ReturnType<typeof getForksInOrg>
  > | null>(null)

  useEffect(() => {
    if (!orgData) {
      return
    }

    getForksInOrg(accessToken, orgData.login).then((forks) => {
      setForks(forks)
    })
  }, [orgData, accessToken])

  return forks
}
