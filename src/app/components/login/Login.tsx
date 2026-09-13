import { MarkGithubIcon } from '@primer/octicons-react'
import { Button, Text } from '@primer/react'
import { signIn } from 'next-auth/react'
import sharedStyles from 'app/styles/shared.module.css'

const signInWithGitHub = async () => {
  await signIn('github')
}

export const Login = () => {
  return (
    <div className={sharedStyles.authCard}>
      <div className={sharedStyles.authCardIcon}>
        <MarkGithubIcon className={sharedStyles.defaultIcon} size={48} />
      </div>
      <div className={sharedStyles.authCardBody}>
        <div className={sharedStyles.authCardTextGroup}>
          <div className={sharedStyles.center}>
            <Text className={sharedStyles.authCardTitle}>
              Sign in to get started.
            </Text>
          </div>
          <div className={sharedStyles.center}>
            <Text className={sharedStyles.authCardSubtitle}>
              Private Mirrors
            </Text>
          </div>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={async () => {
              await signInWithGitHub()
            }}
          >
            Sign in with GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
