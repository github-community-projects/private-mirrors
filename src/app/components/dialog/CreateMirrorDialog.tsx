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

import { useState } from 'react'

interface CreateMirrorDialogProps {
  orgLogin: string
  forkParentOwnerLogin: string
  forkParentName: string
  isOpen: boolean
  closeDialog: () => void
  createMirror: (data: { repoName: string; branchName: string }) => void
}

export const CreateMirrorDialog = ({
  orgLogin,
  forkParentOwnerLogin,
  forkParentName,
  isOpen,
  closeDialog,
  createMirror,
}: CreateMirrorDialogProps) => {
  // set to default value of 'repository-name' for display purposes
  const [repoName, setRepoName] = useState('repository-name')

  if (!isOpen) {
    return null
  }

  return (
    <Dialog
      title="Create a new mirror"
      subtitle="Mirroring a repository provides a place to iterate on changes privately, before any commits are publicly visible."
      footerButtons={[
        {
          content: 'Cancel',
          onClick: () => {
            closeDialog()
            setRepoName('repository-name')
          },
        },
        {
          content: 'Confirm',
          variant: 'primary',
          onClick: () => {
            createMirror({ repoName, branchName: repoName })
            setRepoName('repository-name')
          },
          disabled: repoName === 'repository-name' || repoName === '',
        },
      ]}
      onClose={() => {
        closeDialog()
        setRepoName('repository-name')
      }}
      width="large"
    >
      <Box>
        <FormControl sx={{ marginBottom: '10px' }}>
          <FormControl.Label>Mirror name</FormControl.Label>
          <TextInput
            onChange={(e) => setRepoName(e.target.value)}
            block
            placeholder="e.g. repository-name"
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
                    {orgLogin}/{repoName}
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
