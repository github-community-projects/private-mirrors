'use client'

import { MarkGithubIcon } from '@primer/octicons-react'
import { Avatar, Button, Header, Stack, Text } from '@primer/react'
import { signOut, useSession } from 'next-auth/react'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './header.module.css'

export const MainHeader = () => {
  const session = useSession()

  return (
    <Header className={styles.backgroundBar}>
      <Header.Item>
        <MarkGithubIcon className={sharedStyles.defaultIcon} size={32} />
      </Header.Item>
      <Header.Item full>
        <Text className={styles.mainTitle}>Private Mirrors</Text>
      </Header.Item>
      {session && session.data?.user && (
        <Header.Item className={styles.headerItemNoMargin}>
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
