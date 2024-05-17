import { AlertIcon } from '@primer/octicons-react'
import { Box, Flash, Octicon } from '@primer/react'

interface ListMirrorsErrorFlashProps {
  message: string
}

export const ListMirrorsErrorFlash = ({
  message,
}: ListMirrorsErrorFlashProps) => {
  return (
    <Flash variant="danger">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Box>
          <Octicon icon={AlertIcon}></Octicon>
        </Box>
        <Box sx={{ marginLeft: '20px' }}>{message}</Box>
      </Box>
    </Flash>
  )
}
