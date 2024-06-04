import { Avatar, Label, Link, Pagehead, Spinner, Text } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'
import { ForkData } from 'hooks/useFork'

interface ForkHeaderProps {
  forkData: ForkData
}

export const ForkHeader = ({ forkData }: ForkHeaderProps) => {
  return (
    <Pagehead>
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
                sx={{
                  color: 'fg.default',
                  fontSize: '3',
                  fontWeight: 'bold',
                  paddingRight: '5px',
                }}
              >
                {forkData.organization?.login}/{forkData.name}
              </Link>
              <Label variant="secondary">
                {forkData.private ? 'Private' : 'Public'}
              </Label>
            </Stack.Item>
            <Stack.Item>
              <Text sx={{ color: 'fg.muted' }}>
                Forked from{' '}
                <Link
                  href={`https://github.com/${forkData.parent?.owner.login}/${forkData.parent?.name}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  sx={{ color: 'fg.muted' }}
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
            <Spinner sx={{ marginTop: '5px' }} />
          </Stack.Item>
          <Stack.Item>
            <Text
              sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}
            >
              Loading fork data...
            </Text>
          </Stack.Item>
        </Stack>
      )}
    </Pagehead>
  )
}
