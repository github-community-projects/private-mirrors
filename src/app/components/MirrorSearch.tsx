'use client'

import { SearchIcon } from '@primer/octicons-react'
import { Box, Button, TextInput } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

export default function MirrorSearch(props: { openCreateDialog: () => void }) {
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
        <Stack.Item>
          <Button
            size="large"
            variant="primary"
            onClick={props.openCreateDialog}
          >
            Create mirror
          </Button>
        </Stack.Item>
      </Stack>
    </Box>
  )
}
