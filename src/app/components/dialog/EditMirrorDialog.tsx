import { Box, FormControl, Label, Link, Text, TextInput } from '@primer/react'
import { Stack } from '@primer/react/lib-esm/Stack'
import { Dialog } from '@primer/react/lib-esm/drafts'

import { FC, useState } from 'react'
import { useForkData } from 'utils/fork'
import { useOrgData } from 'utils/organization'

interface EditMirrorDialogProps {
  orgId: string
  mirrorName: string
  isOpen: boolean
  closeDialog: () => void
  editMirror: (data: {
    orgId: string
    mirrorName: string
    newMirrorName: string
  }) => void
}

export const EditMirrorDialog: FC<EditMirrorDialogProps> = ({
  orgId,
  mirrorName,
  isOpen,
  closeDialog,
  editMirror,
}) => {
  const [newMirrorName, setNewMirrorName] = useState('repository-name')

  const orgData = useOrgData()
  const forkData = useForkData()

  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Edit mirror"
      subtitle="Mirroring a repository provides a place to iterate on changes privately, before any commits are publicly visible."
      footerButtons={[
        { content: 'Cancel', onClick: closeDialog },
        {
          content: 'Confirm',
          variant: 'primary',
          onClick: () =>
            editMirror({
              orgId,
              mirrorName,
              newMirrorName,
            }),
          disabled: newMirrorName === 'repository-name' || newMirrorName === '',
        },
      ]}
      onClose={closeDialog}
      width="large"
    >
      <Box>
        <FormControl sx={{ marginBottom: '10px' }}>
          <FormControl.Label>Mirror name</FormControl.Label>
          <TextInput
            onChange={(e) => setNewMirrorName(e.target.value)}
            block
            placeholder="e.g. repository-name"
          />
          <FormControl.Caption>
            This is a private mirror of{' '}
            <Link
              href={`https://github.com/${forkData?.parent?.owner.login}/${forkData?.parent?.name}`}
              target="_blank"
            >
              {forkData?.parent?.owner.login}/{forkData?.parent?.name}
            </Link>
          </FormControl.Caption>
        </FormControl>
        <FormControl>
          <FormControl.Label>Mirror location</FormControl.Label>
          <Box
            sx={{
              padding: '15px',
              border: '1px solid',
              borderColor: 'border.default',
              borderRadius: '6px',
              width: '100%',
            }}
          >
            <Stack direction="vertical" justify="start" gap="none">
              <Stack.Item grow={false}>
                <Stack.Item>
                  <Text
                    sx={{
                      fontSize: '2',
                      fontWeight: 'bold',
                      paddingRight: '10px',
                    }}
                  >
                    {orgData?.login}/{newMirrorName}
                  </Text>
                  <Label variant="secondary">{'Private'}</Label>
                </Stack.Item>
                <Stack.Item grow={false}>
                  <Text
                    sx={{
                      color: 'fg.muted',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    Forked from{' '}
                    <Link
                      href={`https://github.com/${forkData?.parent?.owner.login}/${forkData?.parent?.name}`}
                      target="_blank"
                      sx={{ color: 'fg.muted' }}
                    >
                      {forkData?.parent?.owner.login}/{forkData?.parent?.name}
                    </Link>
                  </Text>
                </Stack.Item>
              </Stack.Item>
            </Stack>
          </Box>
        </FormControl>
      </Box>
    </Dialog>
  )
}
