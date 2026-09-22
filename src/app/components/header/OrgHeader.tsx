import { Avatar, Link, Spinner, Stack, Text } from '@primer/react'
import { OrgData } from 'hooks/useOrganization'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './header.module.css'

interface OrgHeaderProps {
  orgData: OrgData
}

export const OrgHeader = ({ orgData }: OrgHeaderProps) => {
  return (
    <div className={sharedStyles.pageHead}>
      {orgData ? (
        <Stack align="center" direction="horizontal">
          <Stack.Item>
            <Avatar src={orgData.avatar_url} size={48} square={true} />
          </Stack.Item>
          <Stack.Item>
            <Link
              href={orgData.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className={sharedStyles.headerTitle}
            >
              {orgData.login}
            </Link>
          </Stack.Item>
        </Stack>
      ) : (
        <Stack align="center" direction="horizontal">
          <Stack.Item>
            <Spinner className={styles.spinner} />
          </Stack.Item>
          <Stack.Item>
            <Text className={sharedStyles.headerTitle}>
              Loading organization data...
            </Text>
          </Stack.Item>
        </Stack>
      )}
    </div>
  )
}
