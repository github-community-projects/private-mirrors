import { GitHubEndpointConfig, personalOctokit } from 'bot/rest'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const getOrganizationsData = async (
  accessToken: string,
  endpointConfig: GitHubEndpointConfig,
) => {
  const octokit = personalOctokit(accessToken, endpointConfig)
  return await octokit.rest.orgs.listForAuthenticatedUser()
}

export const useOrgsData = () => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken
  const endpointConfig = useGitHubEnvironment()

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

    getOrganizationsData(accessToken, endpointConfig)
      .then((orgs) => {
        setOrganizationData(orgs.data)
      })
      .catch((error: Error) => {
        setError(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [accessToken, endpointConfig])

  return {
    data: organizationData,
    isLoading,
    error,
  }
}

export type OrgsData = Awaited<ReturnType<typeof getOrganizationsData>>['data']
