import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useOrgData } from './organization'

export const getForksInOrg = async (accessToken: string, owner: string) => {
  return (
    await personalOctokit(accessToken).rest.repos.listForOrg({
      per_page: 100,
      type: 'forks',
      org: owner,
    })
  ).data
}

export function useForksData() {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}
  const [forks, setForks] = useState<Awaited<
    ReturnType<typeof getForksInOrg>
  > | null>(null)
  const orgData = useOrgData()

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
