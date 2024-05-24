import { CheckIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Link, Octicon } from '@primer/react'

interface SuccessFlashProps {
  message: string
  mirrorUrl: string
  orgName: string
  mirrorName: string
  closeFlash: () => void
}

export const SuccessFlash = ({
  message,
  mirrorUrl,
  orgName,
  mirrorName,
  closeFlash,
}: SuccessFlashProps) => {
  return (
    <Flash variant="success">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Box>
          <Octicon icon={CheckIcon}></Octicon>
        </Box>
        <Box sx={{ marginLeft: '20px' }}>
          {message}{' '}
          <Link href={mirrorUrl} target="_blank" rel="noreferrer noopener">
            {orgName}/{mirrorName}
          </Link>
          .
        </Box>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss create success"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
