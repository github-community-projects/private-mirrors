'use client'

import { PlusIcon } from '@primer/octicons-react'
import { Box, Button, Dialog, Flash, Link, Spinner, Text } from '@primer/react'
import { personalOctokit } from '../../../../bot/octokit'
import { CreateMirrorDialog } from '../../../components/CreateMirrorDialog'
import { useParams } from 'next/navigation'
import { Octokit } from 'octokit'
import { useCallback, useEffect, useState } from 'react'
import { trpc } from '../../../../utils/trpc'

import { useSession } from 'next-auth/react'

const getOrgInformation = async (accessToken: string, orgId: string) => {
  return (await personalOctokit(accessToken).rest.orgs.get({ org: orgId })).data
}

const getForkById = async (
  accessToken: string,
  repoId: string,
): Promise<Awaited<ReturnType<Octokit['rest']['repos']['get']>>['data']> => {
  return (
    await personalOctokit(accessToken).request('GET /repositories/:id', {
      id: repoId,
    })
  ).data
}

const SingleFork = () => {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}
  const { organizationId, forkId } = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [deleteMirrorName, setDeleteMirrorName] = useState<string | null>(null)
  const closeDialog = useCallback(() => setIsOpen(false), [setIsOpen])
  const openDialog = useCallback(() => setIsOpen(true), [setIsOpen])
  const closeRepoDeleteDialog = useCallback(
    () => setDeleteMirrorName(null),
    [setDeleteMirrorName],
  )
  const openRepoDeleteDialog = useCallback(
    (mirrorName: string) => setDeleteMirrorName(mirrorName),
    [setDeleteMirrorName],
  )
  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrgInformation>
  > | null>(null)
  const [fork, setFork] = useState<Awaited<
    ReturnType<typeof getForkById>
  > | null>(null)
  const {
    mutateAsync: createMirror,
    error: mirrorError,
    data,
    isLoading,
  } = trpc.createMirror.useMutation()

  const {
    mutateAsync: deleteMirror,
    error: deleteError,
    isLoading: deleteMirrorLoading,
  } = trpc.deleteMirror.useMutation()

  const {
    data: mirrors,
    error: mirrorsError,
    isLoading: mirrorsLoading,
    refetch: refetchMirrors,
  } = trpc.listMirrors.useQuery(
    {
      orgId: organizationId as string,
      forkName: fork?.name ?? '',
    },
    {
      enabled: Boolean(organizationId) && Boolean(fork?.name),
    },
  )

  const loadAllData = useCallback(async () => {
    const orgInfo = await getOrgInformation(
      accessToken,
      organizationId as string,
    )
    setOrgData(orgInfo)

    let forkInfo
    try {
      forkInfo = await getForkById(accessToken, forkId as string)
      setFork(forkInfo)
    } catch (e) {
      console.error(e)
      return
    }
  }, [accessToken, organizationId, forkId])

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return
    }

    loadAllData()
  }, [organizationId, accessToken, loadAllData])

  useEffect(() => {
    refetchMirrors()
  }, [isOpen, refetchMirrors])

  const handleOnCreateMirror = useCallback(
    async ({
      repoName,
      branchName,
    }: {
      repoName: string
      branchName: string
    }) => {
      closeDialog()

      await createMirror({
        newRepoName: repoName,
        newBranchName: branchName,
        orgId: String(orgData?.id),
        forkRepoName: fork?.name ?? '',
        forkRepoOwner: fork?.owner.login ?? '',
        forkId: String(fork?.id),
      })

      refetchMirrors()
    },
    [closeDialog, createMirror, refetchMirrors, orgData, fork],
  )

  if (!orgData) {
    return <div>Loading fork data...</div>
  }

  return (
    <Box>
      <Box>
        {mirrorError && <Flash variant="danger">{mirrorError.message}</Flash>}
        {deleteError && <Flash variant="danger">{deleteError.message}</Flash>}
      </Box>
      <Box>
        {data && (
          <Flash variant="success">
            Success! New repo created at{' '}
            <Link href={data.data.html_url}>
              {data.data.owner.login}/{data.data.name}
            </Link>
          </Flash>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href={`https://github.com/${orgData.login}/${fork?.name}`}
          target="_blank"
        >
          <h3>
            {orgData.login} / {fork?.name}
          </h3>
        </Link>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              Creating new repo{' '}
              <Spinner
                sx={{
                  ml: 2,
                  mr: 4,
                }}
              />
            </Box>
          )}
          <Button
            variant="primary"
            leadingVisual={PlusIcon}
            onClick={openDialog}
          >
            Create Mirror
          </Button>
        </Box>
      </Box>
      <Box>
        {mirrorsLoading && <Box>Loading mirrors...</Box>}
        {mirrors && mirrors.length === 0 && (
          <Box>No mirrors found for this fork</Box>
        )}
        {mirrorsError && (
          <Box>Failed to fetch mirrors. {mirrorsError?.message}</Box>
        )}
        <Box>
          {mirrors &&
            mirrors.map((mirror) => (
              <Box key={mirror.id}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    my: 2,
                  }}
                >
                  <Link href={mirror.html_url} target="_blank">
                    {mirror.name}
                  </Link>
                  <Box>
                    <Button
                      variant="danger"
                      onClick={() => {
                        openRepoDeleteDialog(mirror.name)
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
      <CreateMirrorDialog
        isOpen={isOpen}
        closeDialog={closeDialog}
        onCreateMirror={handleOnCreateMirror}
      />
      <Dialog
        isOpen={Boolean(deleteMirrorName)}
        onDismiss={closeRepoDeleteDialog}
      >
        <Dialog.Header>
          <Text>Delete Mirror</Text>
        </Dialog.Header>
        <Box p={3}>
          <Text id="label" fontFamily="sans-serif">
            Are you sure you&apos;d like to delete this mirror?
          </Text>
          <Box display="flex" mt={3} justifyContent="flex-end">
            <Button
              sx={{ mr: 1 }}
              onClick={() => {
                closeRepoDeleteDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteMirrorLoading}
              onClick={async () => {
                await deleteMirror({
                  orgId: orgData.id.toString(),
                  orgName: orgData.login,
                  mirrorName: deleteMirrorName!,
                })
                closeRepoDeleteDialog()
                refetchMirrors()
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default SingleFork
