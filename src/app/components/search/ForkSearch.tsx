'use client'

import { SearchIcon } from '@primer/octicons-react'
import { Box, TextInput } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

export default function ForkSearch() {
  return (
    <Box
      sx={{
        padding: '1px',
        marginBottom: '10px',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Stack align="center" direction="horizontal">
        <Stack.Item grow={true}>
          <TextInput
            leadingVisual={SearchIcon}
            placeholder="Find a repository"
            size="large"
            sx={{ width: '100%' }}
          ></TextInput>
        </Stack.Item>
      </Stack>
    </Box>
  )
}
