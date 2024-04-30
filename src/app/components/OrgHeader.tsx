'use client'

import { Avatar, Box, Pagehead, Spinner, Text } from '@primer/react'
import { useOrgData } from 'utils/organization'

export default function OrgHeader() {
  const orgData = useOrgData()

  return (
    <Pagehead>
      {orgData && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '48px', marginRight: '12px' }}>
            <Avatar src={orgData.avatar_url} size={48} square={true} />
          </Box>
          <Box>
            <Text
              sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}
            >
              {orgData.login}
            </Text>
          </Box>
        </Box>
      )}
      {!orgData && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '48px' }}>
            <Spinner />
          </Box>
          <Box>
            <Text
              sx={{ color: 'fg.default', fontSize: '3', fontWeight: 'bold' }}
            >
              Loading organization data...
            </Text>
          </Box>
        </Box>
      )}
    </Pagehead>
  )
}
