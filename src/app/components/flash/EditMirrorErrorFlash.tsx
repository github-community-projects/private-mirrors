import { AlertIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Octicon } from '@primer/react'

interface EditMirrorErrorFlashProps {
  closeFlash: () => void
}

export const EditMirrorErrorFlash = ({
  closeFlash,
}: EditMirrorErrorFlashProps) => {
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
        <Box sx={{ marginLeft: '20px' }}>Failed to edit mirror.</Box>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss edit error"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
