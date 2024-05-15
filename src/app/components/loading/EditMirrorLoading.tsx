import { Box, Spinner } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

export default function EditMirrorLoading() {
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
        <Stack.Item>Updating mirror...</Stack.Item>
      </Stack>
    </Box>
  )
}
