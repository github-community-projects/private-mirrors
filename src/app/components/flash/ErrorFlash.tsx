import { AlertIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Octicon } from '@primer/react'

interface ErrorFlashProps {
  message: string
  closeFlash: () => void
}

export const ErrorFlash = ({ message, closeFlash }: ErrorFlashProps) => {
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
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss error"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
