import { AlertIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Octicon } from '@primer/react'

interface CreateMirrorErrorFlashProps {
  closeFlash: () => void
}

export const CreateMirrorErrorFlash = ({
  closeFlash,
}: CreateMirrorErrorFlashProps) => {
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
        <Box sx={{ marginLeft: '20px' }}>Failed to create mirror.</Box>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss create error"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
