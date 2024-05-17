import { CheckIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Link, Octicon } from '@primer/react'

interface CreateMirrorSuccessFlashProps {
  mirrorUrl: string
  orgName: string
  mirrorName: string
  closeFlash: () => void
}

export const CreateMirrorSuccessFlash = ({
  mirrorUrl,
  orgName,
  mirrorName,
  closeFlash,
}: CreateMirrorSuccessFlashProps) => {
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
          You have successfully created a new private mirror at{' '}
          <Link href={mirrorUrl} target="_blank">
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
