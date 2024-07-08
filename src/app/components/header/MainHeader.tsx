/* eslint-disable @typescript-eslint/no-floating-promises */
'use client'

import { MarkGithubIcon } from '@primer/octicons-react'
import { Avatar, Button, Header, Octicon, Text } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'
import { signOut, useSession } from 'next-auth/react'

export const MainHeader = () => {
  const session = useSession()

  return (
    <Header
      sx={{
        backgroundColor: 'pageHeaderBg',
        borderBottom: '1px solid',
        borderColor: 'border.default',
      }}
    >
      <Header.Item>
        <Octicon icon={MarkGithubIcon} color="fg.default" size={32}></Octicon>
      </Header.Item>
      <Header.Item full>
        <Text sx={{ color: 'fg.default', fontSize: '2', fontWeight: 'bold' }}>
          Private Mirrors
        </Text>
      </Header.Item>
      {session && session.data?.user && (
        <Header.Item sx={{ mr: 0 }}>
          <Stack align="center" direction="horizontal">
            <Stack.Item>
              <Button
                onClick={() => {
                  signOut()
                }}
              >
                Sign out
              </Button>
            </Stack.Item>
            <Stack.Item>
              {session.data?.user.image && (
                <Avatar src={session.data?.user.image} size={32}></Avatar>
              )}
            </Stack.Item>
          </Stack>
        </Header.Item>
      )}
    </Header>
  )
}
