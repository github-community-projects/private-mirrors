import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const getOrganizationsData = async (accessToken: string) => {
  try {
    const octokit = personalOctokit(accessToken)
    const data = await octokit.rest.orgs.listForAuthenticatedUser()
    return data.data
  } catch (error) {
    console.error('Error fetching organizations', { error })
    return null
  }
}

export const useOrgsData = () => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken

  const [organizationsData, setOrganizationsData] = useState<Awaited<
    ReturnType<typeof getOrganizationsData>
  > | null>(null)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    getOrganizationsData(accessToken).then((orgs) => {
      setOrganizationsData(orgs)
    })
  }, [accessToken])

  return organizationsData
}

export type OrgsData = Awaited<ReturnType<typeof getOrganizationsData>>
