'use client'
import { AlertIcon } from '@primer/octicons-react'
import { Box, Flash, Link, Octicon } from '@primer/react'
import { useOrgData } from 'utils/organization'

export const AppNotInstalledFlash = () => {
  const orgData = useOrgData()

  return (
    <Box>
      {orgData && (
        <Flash variant="danger">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Box>
              <Octicon icon={AlertIcon}></Octicon>
            </Box>
            <Box sx={{ marginLeft: '20px' }}>
              This organization does not have the required App installed. Visit{' '}
              <Link
                href={`https://github.com/organizations/${orgData.login}/settings/installations`}
              >
                this page
              </Link>{' '}
              to install the App to the organization.
            </Box>
          </Box>
        </Flash>
      )}
    </Box>
  )
}
