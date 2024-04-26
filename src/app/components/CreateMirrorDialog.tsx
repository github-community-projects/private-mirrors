import { Box, FormControl, TextInput } from '@primer/react'
import { Dialog } from '@primer/react/drafts'

import { FC, useState } from 'react'

interface CreateMirrorDialogProps {
  isOpen: boolean
  closeDialog: () => void
  onCreateMirror: (data: { repoName: string; branchName: string }) => void
}

export const CreateMirrorDialog: FC<CreateMirrorDialogProps> = ({
  isOpen,
  closeDialog,
  onCreateMirror,
}) => {
  const [repoName, setRepoName] = useState('')

  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Create a new Mirror"
      subtitle={<Box>This will create a new private mirror of this fork</Box>}
      footerButtons={[
        { content: 'Cancel', onClick: closeDialog },
        {
          content: 'Confirm',
          onClick: () => onCreateMirror({ repoName, branchName: repoName }),
        },
      ]}
      onClose={closeDialog}
    >
      <FormControl>
        <FormControl.Label>Repo Name</FormControl.Label>
        <TextInput onChange={(e) => setRepoName(e.target.value)} block />
      </FormControl>
    </Dialog>
  )
}
