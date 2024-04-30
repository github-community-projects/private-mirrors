import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// TODO: Handle org not found

const getOrganizationInformation = async (
  accessToken: string,
  orgId: string,
) => {
  return (await personalOctokit(accessToken).rest.orgs.get({ org: orgId })).data
}

export function useOrgData() {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}
  const { organizationId } = useParams()
  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrganizationInformation>
  > | null>(null)

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return
    }

    getOrganizationInformation(accessToken, organizationId as string).then(
      (orgData) => {
        setOrgData(orgData)
      },
    )
  }, [organizationId, accessToken])
  return orgData
}
