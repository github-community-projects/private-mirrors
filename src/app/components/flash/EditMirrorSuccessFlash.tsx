import { CheckIcon, XIcon } from '@primer/octicons-react'
import { Box, Flash, IconButton, Link, Octicon } from '@primer/react'
import { FC } from 'react'

interface EditMirrorSuccessFlashProps {
  mirrorUrl: string
  orgName: string
  mirrorName: string
  closeFlash: () => void
}

export const EditMirrorSuccessFlash: FC<EditMirrorSuccessFlashProps> = ({
  mirrorUrl,
  orgName,
  mirrorName,
  closeFlash,
}) => {
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
          You have successfully updated mirror{' '}
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
            aria-labelledby="dismiss edit success"
            onClick={closeFlash}
            size="small"
          />
        </Box>
      </Box>
    </Flash>
  )
}
