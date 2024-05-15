'use client'

import { Avatar, Link, Pagehead, Spinner, Text } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'
import { useOrgData } from 'utils/organization'

export default function OrgHeader() {
  const orgData = useOrgData()

  return (
    <Pagehead>
      {orgData ? (
        <Stack align="center" direction="horizontal">
          <Stack.Item>
            <Avatar src={orgData.avatar_url} size={48} square={true} />
          </Stack.Item>
          <Stack.Item>
            <Link
              href={orgData.html_url}
              target="_blank"
              sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}
            >
              {orgData.login}
            </Link>
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
              Loading organization data...
            </Text>
          </Stack.Item>
        </Stack>
      )}
    </Pagehead>
  )
}
