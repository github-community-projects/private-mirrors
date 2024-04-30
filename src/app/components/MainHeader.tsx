'use client'

import { MarkGithubIcon } from '@primer/octicons-react'
import { Avatar, Box, Button, Header, Octicon, Text } from '@primer/react'
import { signOut, useSession } from 'next-auth/react'

export default function MainHeader() {
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
          Internal Contribution Forks
        </Text>
      </Header.Item>
      {session && session.data?.user && (
        <Header.Item sx={{ mr: 0 }}>
          <Box sx={{ paddingRight: '20px' }}>
            <Button
              onClick={() => {
                signOut()
              }}
            >
              Sign out
            </Button>
          </Box>
          <Box>
            {session.data?.user.image && (
              <Avatar src={session.data?.user.image} size={32}></Avatar>
            )}
          </Box>
        </Header.Item>
      )}
    </Header>
  )
}
