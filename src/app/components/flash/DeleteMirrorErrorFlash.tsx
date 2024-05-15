import { AlertIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Link, Octicon } from '@primer/react'
import { FC } from 'react'

interface DeleteMirrorErrorFlashProps {
  closeFlash: () => void
}

export const DeleteMirrorErrorFlash: FC<DeleteMirrorErrorFlashProps> = ({
  closeFlash,
}) => {
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
        <Box sx={{ marginLeft: '20px' }}>Failed to delete mirror.</Box>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss delete error"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
