import { AlertIcon } from '@primer/octicons-react'
import { Box, Flash, Link, Octicon } from '@primer/react'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'

interface AppNotInstalledFlashProps {
  orgLogin: string
}

export const AppNotInstalledFlash = ({
  orgLogin,
}: AppNotInstalledFlashProps) => {
  const { serverUrl } = useGitHubEnvironment()
  return (
    <Box>
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
              href={`${serverUrl}/organizations/${orgLogin}/settings/installations`}
            >
              this page
            </Link>{' '}
            to install the App to the organization.
          </Box>
        </Box>
      </Flash>
    </Box>
  )
}
