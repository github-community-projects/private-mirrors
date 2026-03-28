import {
  Box,
  FormControl,
  Label,
  Link,
  Stack,
  Text,
  TextInput,
} from '@primer/react'
import { Dialog } from '@primer/react/drafts'

import { useEffect, useState } from 'react'

interface EditMirrorDialogProps {
  orgLogin: string
  forkParentOwnerLogin: string
  forkParentName: string
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

export const EditMirrorDialog = ({
  orgLogin,
  forkParentOwnerLogin,
  forkParentName,
  orgId,
  mirrorName,
  isOpen,
  closeDialog,
  editMirror,
}: EditMirrorDialogProps) => {
  // set to the current mirror name for display purposes
  const [newMirrorName, setNewMirrorName] = useState(mirrorName)

  useEffect(() => {
    setNewMirrorName(mirrorName)
  }, [mirrorName, setNewMirrorName])

  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Edit mirror"
      subtitle="Mirroring a repository provides a place to iterate on changes privately, before any commits are publicly visible."
      footerButtons={[
        {
          content: 'Cancel',
          onClick: () => {
            closeDialog()
            setNewMirrorName(mirrorName)
          },
        },
        {
          content: 'Confirm',
          variant: 'primary',
          onClick: () => {
            editMirror({
              orgId,
              mirrorName,
              newMirrorName,
            })
            setNewMirrorName(mirrorName)
          },
          disabled: newMirrorName === mirrorName || newMirrorName === '',
        },
      ]}
      onClose={() => {
        closeDialog()
        setNewMirrorName(mirrorName)
      }}
      width="large"
    >
      <Box>
        <FormControl sx={{ marginBottom: '10px' }}>
          <FormControl.Label>Mirror name</FormControl.Label>
          <TextInput
            onChange={(e) => setNewMirrorName(e.target.value)}
            block
            placeholder={mirrorName}
            maxLength={100}
          />
          <FormControl.Caption>
            This is a private mirror of{' '}
            <Link
              href={`https://github.com/${forkParentOwnerLogin}/${forkParentName}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {forkParentOwnerLogin}/{forkParentName}
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
                    {orgLogin}/{newMirrorName}
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
                      href={`https://github.com/${forkParentOwnerLogin}/${forkParentName}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      sx={{ color: 'fg.muted' }}
                    >
                      {forkParentOwnerLogin}/{forkParentName}
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
