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
      title="Create a new mirror"
      subtitle="Mirroring a repository provides a place to iterate on changes privately, before any commits are publicly visible."
      footerButtons={[
        { content: 'Cancel', onClick: closeDialog },
        {
          content: 'Confirm',
          variant: 'primary',
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
