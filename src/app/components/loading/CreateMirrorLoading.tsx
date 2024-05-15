import { Box, Spinner } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

export default function CreateMirrorLoading() {
  return (
    <Box
      sx={{
        backgroundColor: 'pageHeaderBg',
        padding: '10px',
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: '6px',
      }}
    >
      <Stack direction="horizontal" align="center">
        <Stack.Item>
          <Spinner sx={{ marginTop: '5px' }} />
        </Stack.Item>
        <Stack.Item>Creating new mirror...</Stack.Item>
      </Stack>
    </Box>
  )
}
