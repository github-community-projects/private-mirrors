import { GitHubEndpointConfig, personalOctokit } from 'bot/rest'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Octokit } from 'octokit'
import { useEffect, useState } from 'react'

const getForkById = async (
  accessToken: string,
  repoId: string,
  endpointConfig: GitHubEndpointConfig,
) => {
  try {
    return (
      await personalOctokit(accessToken, endpointConfig).request(
        'GET /repositories/{id}',
        {
          id: repoId,
        },
      )
    ).data as Awaited<ReturnType<Octokit['rest']['repos']['get']>>['data']
  } catch (error) {
    console.error('Error fetching fork', { error })
    return null
  }
}

export const useForkData = () => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken
  const endpointConfig = useGitHubEnvironment()

  const { organizationId, forkId } = useParams()

  const [fork, setFork] = useState<Awaited<
    ReturnType<typeof getForkById>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId || !forkId || !accessToken) {
      return
    }

    setIsLoading(true)
    setError(null)

    getForkById(accessToken, forkId as string, endpointConfig)
      .then((fork) => {
        setFork(fork)
      })
      .catch((error: Error) => {
        setError(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [accessToken, endpointConfig, organizationId, forkId])

  return {
    data: fork,
    isLoading,
    error,
  }
}

export type ForkData = Awaited<ReturnType<typeof getForkById>>
