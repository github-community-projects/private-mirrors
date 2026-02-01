import { Box, Spinner, Stack } from '@primer/react'

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
