 
import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export const getOrganizationData = async (
  accessToken: string,
  orgId: string,
) => {
  try {
    return (await personalOctokit(accessToken).rest.orgs.get({ org: orgId }))
      .data
  } catch (error) {
    console.error('Error fetching organization', { error })
    return null
  }
}

export const useOrgData = () => {
  const router = useRouter()

  const { organizationId } = useParams()

  const session = useSession()
  const accessToken = session.data?.user.accessToken

  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrganizationData>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return
    }

    setIsLoading(true)
    setError(null)

    getOrganizationData(accessToken, organizationId as string)
      .then((orgData) => {
        if (!orgData) {
          router.push('/_error')
        }

        setOrgData(orgData)
      })
      .catch((error: Error) => {
        setError(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [organizationId, accessToken, router])

  return {
    data: orgData,
    isLoading,
    error,
  }
}

export type OrgData = Awaited<ReturnType<typeof getOrganizationData>>
