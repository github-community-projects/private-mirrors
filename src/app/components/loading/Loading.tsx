import { Box, Spinner } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'

interface LoadingProps {
  message: string
}

export const Loading = ({ message }: LoadingProps) => {
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
        <Stack.Item>{message}</Stack.Item>
      </Stack>
    </Box>
  )
}
