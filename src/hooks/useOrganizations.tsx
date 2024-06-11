import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const getOrganizationsData = async (accessToken: string) => {
  const octokit = personalOctokit(accessToken)
  return await octokit.rest.orgs.listForAuthenticatedUser()
}

export const useOrgsData = () => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken

  const [organizationData, setOrganizationData] = useState<OrgsData | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    setIsLoading(true)
    setError(null)

    getOrganizationsData(accessToken)
      .then((orgs) => {
        setOrganizationData(orgs.data)
      })
      .catch((error: Error) => {
        setError(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [accessToken])

  return {
    data: organizationData,
    isLoading,
    error,
  }
}

export type OrgsData = Awaited<ReturnType<typeof getOrganizationsData>>['data']
