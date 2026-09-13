import { AlertIcon } from '@primer/octicons-react'
import { Flash, Link } from '@primer/react'
import sharedStyles from 'app/styles/shared.module.css'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'
import styles from './flash.module.css'

interface AppNotInstalledFlashProps {
  orgLogin: string
}

export const AppNotInstalledFlash = ({
  orgLogin,
}: AppNotInstalledFlashProps) => {
  const { serverUrl } = useGitHubEnvironment()
  return (
    <Flash variant="danger">
      <div className={sharedStyles.flexRowCenter}>
        <AlertIcon />
        <div className={styles.message}>
          This organization does not have the required App installed. Visit{' '}
          <Link
            href={`${serverUrl}/organizations/${orgLogin}/settings/installations`}
          >
            this page
          </Link>{' '}
          to install the App to the organization.
        </div>
      </div>
    </Flash>
  )
}
