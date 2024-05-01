'use client'
import { Box, Flash, Link } from '@primer/react'
import { useOrgData } from 'utils/organization'

export default function AppNotInstalled() {
  const orgData = useOrgData()

  return (
    <Box>
      {orgData && (
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
  )
}
