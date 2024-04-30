'use client'

import { ActionList, Avatar, Box, Flash, Link, Octicon } from '@primer/react'
import { useParams } from 'next/navigation'
import { trpc } from '../../utils/trpc'

import { useSession } from 'next-auth/react'
import { useOrgData } from 'utils/organization'
import { useForksData } from 'utils/forks'
import { RepoListItem } from 'app/components/RepoListItem'

const Organization = () => {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}
  const { organizationId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })
  const orgData = useOrgData()
  const forks = useForksData()

  return (
    <Box>
      <Box>
        {!isLoading && !data?.installed && (
          <Flash variant="danger">
            This organization does not have the required App installed. Visit{' '}
            <Link
              href={`https://github.com/organizations/${orgData.login}/settings/installations`}
            >
              this page
            </Link>{' '}
            to install the App to the organization.
          </Flash>
        )}
      </Box>
      <Box>
        {forks && (
          <ActionList showDividers>
            {forks.map((fork) => (
              <RepoListItem
                key={fork.id}
                fork={fork}
                orgId={String(orgData.id)}
                accessToken={accessToken}
              />
            ))}
          </ActionList>
        )}
        {forks && forks.length === 0 && <Box>No forks found</Box>}
      </Box>
    </Box>
  )
}

export default Organization
