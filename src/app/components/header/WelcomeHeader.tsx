import { RepoForkedIcon } from '@primer/octicons-react'
import { Octicon, Pagehead, Text } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

export const WelcomeHeader = () => {
  return (
    <Pagehead>
      <Stack align="center" direction="horizontal">
        <Stack.Item>
          <Octicon icon={RepoForkedIcon} size={48} />
        </Stack.Item>
        <Stack.Item>
          <Text sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}>
            Welcome to Internal Contribution Forks!
          </Text>
        </Stack.Item>
      </Stack>
    </Pagehead>
  )
}
