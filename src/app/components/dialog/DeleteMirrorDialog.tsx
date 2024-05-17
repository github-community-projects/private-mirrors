import { Box, Text } from '@primer/react'
import { Dialog } from '@primer/react/lib-esm/drafts'

interface DeleteMirrorDialogProps {
  orgLogin: string
  orgId: string
  orgName: string
  mirrorName: string
  isOpen: boolean
  closeDialog: () => void
  deleteMirror: (data: {
    orgId: string
    orgName: string
    mirrorName: string
  }) => void
}

export const DeleteMirrorDialog = ({
  orgLogin,
  orgId,
  orgName,
  mirrorName,
  isOpen,
  closeDialog,
  deleteMirror,
}: DeleteMirrorDialogProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Delete mirror"
      footerButtons={[
        { content: 'Cancel', onClick: closeDialog },
        {
          content: 'Delete',
          variant: 'danger',
          onClick: () => deleteMirror({ orgId, orgName, mirrorName }),
        },
      ]}
      onClose={closeDialog}
    >
      <Box>
        Are you sure you&apos;d like to delete
        <Text sx={{ fontWeight: 'bold' }}>
          {' '}
          {orgLogin}/{mirrorName}?
        </Text>
      </Box>
    </Dialog>
  )
}
