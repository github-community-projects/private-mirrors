import { RepoForkedIcon } from '@primer/octicons-react'
import { Stack, Text } from '@primer/react'
import sharedStyles from 'app/styles/shared.module.css'

export const WelcomeHeader = () => {
  return (
    <div className={sharedStyles.pageHead}>
      <Stack align="center" direction="horizontal">
        <Stack.Item>
          <RepoForkedIcon size={48} />
        </Stack.Item>
        <Stack.Item>
          <Text className={sharedStyles.headerTitle}>
            Welcome to Private Mirrors App!
          </Text>
        </Stack.Item>
      </Stack>
    </div>
  )
}
