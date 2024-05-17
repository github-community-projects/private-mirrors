import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Octokit } from 'octokit'
import { useEffect, useState } from 'react'

const getForkById = async (
  accessToken: string,
  repoId: string,
): Promise<
  Awaited<ReturnType<Octokit['rest']['repos']['get']>>['data'] | null
> => {
  try {
    return (
      await personalOctokit(accessToken).request('GET /repositories/:id', {
        id: repoId,
      })
    ).data
  } catch (error) {
    return null
  }
}

export const useForkData = () => {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}

  const { organizationId, forkId } = useParams()

  const [fork, setFork] = useState<Awaited<
    ReturnType<typeof getForkById>
  > | null>(null)

  useEffect(() => {
    if (!organizationId || !forkId) {
      return
    }

    getForkById(accessToken, forkId as string).then((fork) => {
      setFork(fork)
    })
  }, [accessToken, organizationId, forkId])

  return fork
}

export type ForkData = Awaited<ReturnType<typeof getForkById>>
