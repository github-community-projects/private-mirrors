import {
  Dialog,
  FormControl,
  Label,
  Link,
  Stack,
  Text,
  TextInput,
} from '@primer/react'
import { mirrorNameSchema } from 'server/repos/schema'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'

import { useEffect, useState } from 'react'
import styles from './dialog.module.css'

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
  const { serverUrl } = useGitHubEnvironment()
  // set to the current mirror name for display purposes
  const [newMirrorName, setNewMirrorName] = useState(mirrorName)

  useEffect(() => {
    setNewMirrorName(mirrorName)
  }, [mirrorName, setNewMirrorName])

  if (!isOpen) {
    return null
  }

  const hasUserInput = newMirrorName !== mirrorName && newMirrorName !== ''
  const validation = mirrorNameSchema.safeParse(newMirrorName)
  const validationError =
    hasUserInput && !validation.success
      ? validation.error.issues[0].message
      : null

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
          disabled: !hasUserInput || !validation.success,
        },
      ]}
      onClose={() => {
        closeDialog()
        setNewMirrorName(mirrorName)
      }}
      width="large"
    >
      <div>
        <FormControl className={styles.fieldMarginBottom}>
          <FormControl.Label>Mirror name</FormControl.Label>
          <TextInput
            onChange={(e) => setNewMirrorName(e.target.value)}
            block
            placeholder={mirrorName}
            maxLength={100}
            validationStatus={validationError ? 'error' : undefined}
          />
          {validationError ? (
            <FormControl.Validation variant="error">
              {validationError}
            </FormControl.Validation>
          ) : (
            <FormControl.Caption>
              This is a private mirror of{' '}
              <Link
                href={`${serverUrl}/${forkParentOwnerLogin}/${forkParentName}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {forkParentOwnerLogin}/{forkParentName}
              </Link>
            </FormControl.Caption>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label>Mirror location</FormControl.Label>
          <div className={styles.locationBox}>
            <Stack direction="vertical" justify="start" gap="none">
              <Stack.Item grow={false}>
                <Stack.Item>
                  <Text className={styles.repoName}>
                    {orgLogin}/{newMirrorName}
                  </Text>
                  <Label variant="secondary">{'Private'}</Label>
                </Stack.Item>
                <Stack.Item grow={false}>
                  <Text className={styles.forkedFrom}>
                    Forked from{' '}
                    <Link
                      href={`${serverUrl}/${forkParentOwnerLogin}/${forkParentName}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={styles.mutedLink}
                    >
                      {forkParentOwnerLogin}/{forkParentName}
                    </Link>
                  </Text>
                </Stack.Item>
              </Stack.Item>
            </Stack>
          </div>
        </FormControl>
      </div>
    </Dialog>
  )
}
