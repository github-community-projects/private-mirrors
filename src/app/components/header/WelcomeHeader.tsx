import { RepoForkedIcon } from '@primer/octicons-react'
import { Octicon, Pagehead, Stack, Text } from '@primer/react'

export const WelcomeHeader = () => {
  return (
    <Pagehead>
      <Stack align="center" direction="horizontal">
        <Stack.Item>
          <Octicon icon={RepoForkedIcon} size={48} />
        </Stack.Item>
        <Stack.Item>
          <Text sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}>
            Welcome to Private Mirrors App!
          </Text>
        </Stack.Item>
      </Stack>
    </Pagehead>
  )
}
