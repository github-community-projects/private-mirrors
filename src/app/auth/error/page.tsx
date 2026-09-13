'use client'

import { MarkGithubIcon } from '@primer/octicons-react'
import { Button, Text } from '@primer/react'
import { useRouter } from 'next/navigation'
import sharedStyles from 'app/styles/shared.module.css'

const ErrorPage = () => {
  const router = useRouter()

  return (
    <div className={sharedStyles.authCard}>
      <div className={sharedStyles.authCardIcon}>
        <MarkGithubIcon className={sharedStyles.defaultIcon} size={48} />
      </div>
      <div className={sharedStyles.authCardBody}>
        <div>
          <div className={sharedStyles.center}>
            <Text className={sharedStyles.authCardTitle}>Access denied</Text>
          </div>
          <div className={sharedStyles.center}>
            <Text className={sharedStyles.authCardSubtitle}>
              Reach out to your organization admin to get access
            </Text>
          </div>
        </div>
        <div className={sharedStyles.marginTop15}>
          <Button
            onClick={() => {
              router.push('/')
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
