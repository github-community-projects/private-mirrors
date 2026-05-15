import { ClockIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Link, Octicon } from '@primer/react'

interface PendingFlashProps {
  mirrorUrl: string
  orgLogin: string
  mirrorName: string
  closeFlash: () => void
}

export const PendingFlash = ({
  mirrorUrl,
  orgLogin,
  mirrorName,
  closeFlash,
}: PendingFlashProps) => {
  return (
    <Flash variant="warning">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Box>
          <Octicon icon={ClockIcon}></Octicon>
        </Box>
        <Box sx={{ marginLeft: '20px' }}>
          Mirror creation is taking longer than expected and will continue in
          the background. Your new private mirror{' '}
          <Link href={mirrorUrl} target="_blank" rel="noreferrer noopener">
            {orgLogin}/{mirrorName}
          </Link>{' '}
          may take some time to be fully populated with commits.
        </Box>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss create pending"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
