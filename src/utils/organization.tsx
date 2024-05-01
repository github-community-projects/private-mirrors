import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// TODO: Handle org not found

export const getOrganizationData = async (
  accessToken: string,
  orgId: string,
) => {
  return (await personalOctokit(accessToken).rest.orgs.get({ org: orgId })).data
}

export function useOrgData() {
  const { organizationId } = useParams()

  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}

  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrganizationData>
  > | null>(null)

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return
    }

    getOrganizationData(accessToken, organizationId as string).then(
      (orgData) => {
        setOrgData(orgData)
      },
    )
  }, [organizationId, accessToken])

  return orgData
}
