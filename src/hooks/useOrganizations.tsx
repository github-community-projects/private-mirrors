import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const listForAuthenticatedUser = async (accessToken: string) => {
  const octokit = personalOctokit(accessToken)
  return (await octokit.rest.orgs.listForAuthenticatedUser()).data
}

const getOrganizationsData = async (accessToken: string) => {
  const orgsData: {
    data: OrgsData
    isLoading: boolean
    error: any
  } = {
    data: [],
    isLoading: true,
    error: null,
  }

  try {
    const octokit = personalOctokit(accessToken)
    const data = await octokit.rest.orgs.listForAuthenticatedUser()
    orgsData.data = data.data
    orgsData.isLoading = false
  } catch (error) {
    console.error('Error fetching organizations', { error })
    orgsData.error = error
    orgsData.isLoading = false
  }

  return orgsData
}

export const useOrgsData = () => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken

  const [organizationsData, setOrganizationsData] = useState<GetOrgsData>({
    data: [],
    isLoading: true,
    error: null,
  })

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

export type OrgsData = Awaited<ReturnType<typeof listForAuthenticatedUser>>

type GetOrgsData = Awaited<ReturnType<typeof getOrganizationsData>>
