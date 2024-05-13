import { Box, Text } from '@primer/react'
import { Dialog } from '@primer/react/lib-esm/drafts'

import { FC } from 'react'

interface DeleteMirrorDialogProps {
  orgId: string
  orgName: string
  mirrorName: string
  isOpen: boolean
  closeDialog: () => void
  onDeleteMirror: (data: {
    orgId: string
    orgName: string
    mirrorName: string
  }) => void
}

export const DeleteMirrorDialog: FC<DeleteMirrorDialogProps> = ({
  orgId,
  orgName,
  mirrorName,
  isOpen,
  closeDialog,
  onDeleteMirror,
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Delete Mirror"
      footerButtons={[
        { content: 'Cancel', onClick: closeDialog },
        {
          content: 'Delete',
          variant: 'danger',
          onClick: () => onDeleteMirror({ orgId, orgName, mirrorName }),
        },
      ]}
      onClose={closeDialog}
    >
      <Box>
        <Text>Are you sure you&apos;d like to delete this mirror?</Text>
      </Box>
    </Dialog>
  )
}
