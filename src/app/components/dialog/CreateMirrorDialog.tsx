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

import { useState } from 'react'
import styles from './dialog.module.css'

const DEFAULT_REPO_NAME = 'repository-name'

interface CreateMirrorDialogProps {
  orgLogin: string
  forkParentOwnerLogin: string
  forkParentName: string
  isOpen: boolean
  closeDialog: () => void
  createMirror: (data: { repoName: string }) => void
}

export const CreateMirrorDialog = ({
  orgLogin,
  forkParentOwnerLogin,
  forkParentName,
  isOpen,
  closeDialog,
  createMirror,
}: CreateMirrorDialogProps) => {
  const { serverUrl } = useGitHubEnvironment()
  // set to default value of 'repository-name' for display purposes
  const [repoName, setRepoName] = useState(DEFAULT_REPO_NAME)

  if (!isOpen) {
    return null
  }

  const hasUserInput = repoName !== DEFAULT_REPO_NAME && repoName !== ''
  const validation = mirrorNameSchema.safeParse(repoName)
  const validationError =
    hasUserInput && !validation.success
      ? validation.error.issues[0].message
      : null

  return (
    <Dialog
      title="Create a new mirror"
      subtitle="Mirroring a repository provides a place to iterate on changes privately, before any commits are publicly visible."
      footerButtons={[
        {
          content: 'Cancel',
          onClick: () => {
            closeDialog()
            setRepoName(DEFAULT_REPO_NAME)
          },
        },
        {
          content: 'Confirm',
          variant: 'primary',
          onClick: () => {
            createMirror({ repoName })
            setRepoName(DEFAULT_REPO_NAME)
          },
          disabled: !hasUserInput || !validation.success,
        },
      ]}
      onClose={() => {
        closeDialog()
        setRepoName(DEFAULT_REPO_NAME)
      }}
      width="large"
    >
      <div>
        <FormControl className={styles.fieldMarginBottom}>
          <FormControl.Label>Mirror name</FormControl.Label>
          <TextInput
            onChange={(e) => setRepoName(e.target.value)}
            block
            placeholder="e.g. repository-name"
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
                    {orgLogin}/{repoName}
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
