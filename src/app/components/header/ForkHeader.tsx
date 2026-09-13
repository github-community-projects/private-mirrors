import { Avatar, Label, Link, Spinner, Stack, Text } from '@primer/react'
import { ForkData } from 'hooks/useFork'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './header.module.css'

interface ForkHeaderProps {
  forkData: ForkData
}

export const ForkHeader = ({ forkData }: ForkHeaderProps) => {
  const { serverUrl } = useGitHubEnvironment()
  return (
    <div className={sharedStyles.pageHead}>
      {forkData ? (
        <Stack direction="horizontal" align="center">
          <Stack.Item>
            <Avatar
              src={
                forkData.parent?.owner.avatar_url ?? forkData.owner.avatar_url
              }
              size={48}
            />
          </Stack.Item>
          <Stack.Item grow={false}>
            <Stack.Item>
              <Link
                href={forkData.html_url}
                target="_blank"
                rel="noreferrer noopener"
                className={`${sharedStyles.headerTitle} ${styles.titlePaddingRight}`}
              >
                {forkData.organization?.login}/{forkData.name}
              </Link>
              <Label variant="secondary">
                {forkData.private ? 'Private' : 'Public'}
              </Label>
            </Stack.Item>
            <Stack.Item>
              <Text className={styles.muted}>
                Forked from{' '}
                <Link
                  href={`${serverUrl}/${forkData.parent?.owner.login}/${forkData.parent?.name}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={styles.muted}
                >
                  {forkData.parent?.owner.login}/{forkData.parent?.name}
                </Link>
              </Text>
            </Stack.Item>
          </Stack.Item>
        </Stack>
      ) : (
        <Stack align="center" direction="horizontal">
          <Stack.Item>
            <Spinner className={styles.spinner} />
          </Stack.Item>
          <Stack.Item>
            <Text className={sharedStyles.headerTitle}>
              Loading fork data...
            </Text>
          </Stack.Item>
        </Stack>
      )}
    </div>
  )
}
