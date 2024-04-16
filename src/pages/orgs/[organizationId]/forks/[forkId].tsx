import { PlusIcon } from '@primer/octicons-react'
import { Box, Button, Dialog, Flash, Link, Spinner, Text } from '@primer/react'
import { personalOctokit } from 'bot/octokit'
import { getAuthServerSideProps } from 'components/auth-guard'
import { CreateMirrorDialog } from 'components/create-mirror'
import { useRouter } from 'next/router'
import type { InferGetServerSidePropsType } from 'next/types'
import { Octokit } from 'octokit'
import { useCallback, useEffect, useState } from 'react'
import { trpc } from 'utils/trpc'

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

const SingleFork = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { accessToken } = (props.session?.user as any) ?? {}
  const router = useRouter()
  const { organizationId, forkId } = router.query
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
    mutate: createMirror,
    error: mirrorError,
    data,
    isLoading,
  } = trpc.git.createMirror.useMutation()

  const { mutate: deleteMirror, error: deleteError } =
    trpc.repos.deleteMirror.useMutation()

  const {
    data: mirrors,
    error: mirrorsError,
    isLoading: mirrorsLoading,
    refetch: refetchMirrors,
  } = trpc.repos.listMirrors.useQuery(
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
    ({ repoName, branchName }: { repoName: string; branchName: string }) => {
      createMirror({
        newRepoName: repoName,
        newBranchName: branchName,
        orgId: String(orgData?.id),
        forkRepoName: fork?.name ?? '',
        forkRepoOwner: fork?.owner.login ?? '',
        forkId: String(fork?.id),
      })

      closeDialog()
    },
    [closeDialog, createMirror, orgData, fork],
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
        {mirrors && mirrors.items.length === 0 && (
          <Box>No mirrors found for this fork</Box>
        )}
        {mirrorsError && (
          <Box>Failed to fetch mirrors. {mirrorsError?.message}</Box>
        )}
        <Box>
          {mirrors &&
            mirrors.items.map((mirror) => (
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
              onClick={() => {
                deleteMirror({
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

export const getServerSideProps = getAuthServerSideProps
