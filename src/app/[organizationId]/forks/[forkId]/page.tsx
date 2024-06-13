/* eslint-disable @typescript-eslint/no-floating-promises */
'use client'

import { useParams } from 'next/navigation'
import { trpc } from '../../../../utils/trpc'

import {
  KebabHorizontalIcon,
  PencilIcon,
  RepoIcon,
  TrashIcon,
} from '@primer/octicons-react'
import {
  ActionList,
  ActionMenu,
  Box,
  IconButton,
  Link,
  Octicon,
  RelativeTime,
} from '@primer/react'
import Blankslate from '@primer/react/lib-esm/Blankslate/Blankslate'
import { DataTable, Table } from '@primer/react/lib-esm/DataTable'
import { Stack } from '@primer/react/lib-esm/Stack'
import { ForkBreadcrumbs } from 'app/components/breadcrumbs/ForkBreadcrumbs'
import { CreateMirrorDialog } from 'app/components/dialog/CreateMirrorDialog'
import { DeleteMirrorDialog } from 'app/components/dialog/DeleteMirrorDialog'
import { EditMirrorDialog } from 'app/components/dialog/EditMirrorDialog'
import { AppNotInstalledFlash } from 'app/components/flash/AppNotInstalledFlash'
import { ErrorFlash } from 'app/components/flash/ErrorFlash'
import { SuccessFlash } from 'app/components/flash/SuccessFlash'
import { ForkHeader } from 'app/components/header/ForkHeader'
import { Loading } from 'app/components/loading/Loading'
import { SearchWithCreate } from 'app/components/search/SearchWithCreate'
import Fuse from 'fuse.js'
import { useForkData } from 'hooks/useFork'
import { useOrgData } from 'hooks/useOrganization'
import { useCallback, useState } from 'react'

const Fork = () => {
  const { organizationId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })

  const orgData = useOrgData()
  const forkData = useForkData()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const closeCreateDialog = useCallback(
    () => setIsCreateDialogOpen(false),
    [setIsCreateDialogOpen],
  )
  const openCreateDialog = useCallback(
    () => setIsCreateDialogOpen(true),
    [setIsCreateDialogOpen],
  )

  const [editMirrorName, setEditMirrorName] = useState<string | null>(null)
  const closeEditDialog = useCallback(
    () => setEditMirrorName(null),
    [setEditMirrorName],
  )
  const openEditDialog = useCallback(
    (mirrorName: string) => setEditMirrorName(mirrorName),
    [setEditMirrorName],
  )

  const [deleteMirrorName, setDeleteMirrorName] = useState<string | null>(null)
  const [numberOfMirrorsOnPage, setNumberOfMirrorsOnPage] = useState(0)

  const closeDeleteDialog = useCallback(
    () => setDeleteMirrorName(null),
    [setDeleteMirrorName],
  )
  const openDeleteDialog = useCallback(
    (mirrorName: string, numberOfMirrorsOnPage: number) => {
      setDeleteMirrorName(mirrorName)
      setNumberOfMirrorsOnPage(numberOfMirrorsOnPage)
    },
    [setDeleteMirrorName, setNumberOfMirrorsOnPage],
  )

  const [isCreateErrorFlashOpen, setIsCreateErrorFlashOpen] = useState(false)
  const closeCreateErrorFlash = useCallback(
    () => setIsCreateErrorFlashOpen(false),
    [setIsCreateErrorFlashOpen],
  )
  const openCreateErrorFlash = useCallback(
    () => setIsCreateErrorFlashOpen(true),
    [setIsCreateErrorFlashOpen],
  )

  const [isEditErrorFlashOpen, setIsEditErrorFlashOpen] = useState(false)
  const closeEditErrorFlash = useCallback(
    () => setIsEditErrorFlashOpen(false),
    [setIsEditErrorFlashOpen],
  )
  const openEditErrorFlash = useCallback(
    () => setIsEditErrorFlashOpen(true),
    [setIsEditErrorFlashOpen],
  )

  const [isDeleteErrorFlashOpen, setIsDeleteErrorFlashOpen] = useState(false)
  const closeDeleteErrorFlash = useCallback(
    () => setIsDeleteErrorFlashOpen(false),
    [setIsDeleteErrorFlashOpen],
  )
  const openDeleteErrorFlash = useCallback(
    () => setIsDeleteErrorFlashOpen(true),
    [setIsDeleteErrorFlashOpen],
  )

  const [isCreateSuccessFlashOpen, setIsCreateSuccessFlashOpen] =
    useState(false)
  const closeCreateSuccessFlash = useCallback(
    () => setIsCreateSuccessFlashOpen(false),
    [setIsCreateSuccessFlashOpen],
  )
  const openCreateSuccessFlash = useCallback(
    () => setIsCreateSuccessFlashOpen(true),
    [setIsCreateSuccessFlashOpen],
  )

  const [isEditSuccessFlashOpen, setIsEditSuccessFlashOpen] = useState(false)
  const closeEditSuccessFlash = useCallback(
    () => setIsEditSuccessFlashOpen(false),
    [setIsEditSuccessFlashOpen],
  )
  const openEditSuccessFlash = useCallback(
    () => setIsEditSuccessFlashOpen(true),
    [setIsEditSuccessFlashOpen],
  )

  const closeAllFlashes = useCallback(() => {
    closeCreateErrorFlash()
    closeCreateSuccessFlash()
    closeEditErrorFlash()
    closeEditSuccessFlash()
    closeDeleteErrorFlash()
  }, [
    closeCreateErrorFlash,
    closeCreateSuccessFlash,
    closeEditErrorFlash,
    closeEditSuccessFlash,
    closeDeleteErrorFlash,
  ])

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  const {
    data: createMirrorData,
    isLoading: createMirrorLoading,
    mutateAsync: createMirror,
  } = trpc.createMirror.useMutation()

  const {
    data: mirrors,
    error: listMirrorsError,
    isLoading: mirrorsLoading,
    refetch: refetchMirrors,
  } = trpc.listMirrors.useQuery(
    {
      orgId: organizationId as string,
      forkName: forkData?.name ?? '',
    },
    {
      enabled: Boolean(organizationId) && Boolean(forkData?.name),
    },
  )

  const {
    data: editMirrorData,
    isLoading: editMirrorLoading,
    mutateAsync: editMirror,
  } = trpc.editMirror.useMutation()

  const { isLoading: deleteMirrorLoading, mutateAsync: deleteMirror } =
    trpc.deleteMirror.useMutation()

  const handleOnCreateMirror = useCallback(
    async ({
      repoName,
      branchName,
    }: {
      repoName: string
      branchName: string
    }) => {
      // close other flashes and dialogs when this is opened
      closeAllFlashes()
      closeCreateDialog()

      await createMirror({
        newRepoName: repoName,
        newBranchName: branchName,
        orgId: String(orgData?.id),
        forkRepoName: forkData?.name ?? '',
        forkRepoOwner: forkData?.owner.login ?? '',
        forkId: String(forkData?.id),
      }).then((res) => {
        if (res.success) {
          openCreateSuccessFlash()
        } else {
          openCreateErrorFlash()
        }
      })

      refetchMirrors()
    },
    [
      closeAllFlashes,
      closeCreateDialog,
      createMirror,
      refetchMirrors,
      openCreateSuccessFlash,
      openCreateErrorFlash,
      orgData,
      forkData,
    ],
  )

  const handleOnEditMirror = useCallback(
    async ({
      mirrorName,
      newMirrorName,
    }: {
      mirrorName: string
      newMirrorName: string
    }) => {
      // close other flashes and dialogs when this is opened
      closeAllFlashes()
      closeEditDialog()

      await editMirror({
        orgId: String(orgData?.id),
        mirrorName,
        newMirrorName,
      }).then((res) => {
        if (res.success) {
          openEditSuccessFlash()
        } else {
          openEditErrorFlash()
        }
      })

      refetchMirrors()
    },
    [
      closeAllFlashes,
      closeEditDialog,
      editMirror,
      refetchMirrors,
      openEditErrorFlash,
      openEditSuccessFlash,
      orgData,
    ],
  )

  const handleOnDeleteMirror = useCallback(
    async ({ mirrorName }: { mirrorName: string }) => {
      // close other flashes and dialogs when this is opened
      closeAllFlashes()
      closeDeleteDialog()

      await deleteMirror({
        mirrorName,
        orgId: String(orgData?.id),
        orgName: orgData?.name ?? '',
      }).then((res) => {
        if (!res.success) {
          openDeleteErrorFlash()
        }
      })

      refetchMirrors()

      // if the mirror being deleted is the only mirror on the page reload the page
      if (numberOfMirrorsOnPage === 1) {
        window.location.reload()
      }
    },
    [
      closeAllFlashes,
      closeDeleteDialog,
      deleteMirror,
      openDeleteErrorFlash,
      refetchMirrors,
      numberOfMirrorsOnPage,
      orgData,
    ],
  )

  // show loading table
  if (!mirrors || mirrorsLoading) {
    return (
      <Box>
        <ForkHeader forkData={forkData} />
        <ForkBreadcrumbs orgData={orgData} forkData={forkData} />
        <SearchWithCreate
          placeholder="Find a mirror"
          createButtonLabel="Create mirror"
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          openCreateDialog={openCreateDialog}
        />
        <Table.Container>
          <Table.Skeleton
            columns={[
              {
                header: 'Mirror name',
                rowHeader: true,
                width: 'auto',
              },
              {
                header: 'Last updated',
                width: 'auto',
              },
              {
                id: 'actions',
                header: '',
                width: '50px',
                align: 'end',
              },
            ]}
            rows={10}
            cellPadding="spacious"
          />
          <Table.Pagination aria-label="pagination" totalCount={0} />
        </Table.Container>
      </Box>
    )
  }

  // set up search
  const fuse = new Fuse(mirrors, {
    keys: ['name', 'owner.name', 'owner.login'],
    threshold: 0.2,
  })

  // perform search if there is a search value
  let mirrorSet = []
  if (searchValue) {
    mirrorSet = fuse.search(searchValue).map((result) => result.item)
  } else {
    mirrorSet = mirrors
  }

  const mirrorPaginationSet = mirrorSet.slice(start, end)

  return (
    <Box>
      <ForkHeader forkData={forkData} />
      <Box sx={{ marginBottom: '10px' }}>
        {!isLoading && !data?.installed && (
          <AppNotInstalledFlash orgLogin={orgData?.login as string} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {createMirrorLoading && <Loading message="Creating new mirror..." />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {editMirrorLoading && <Loading message="Updating mirror..." />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {deleteMirrorLoading && <Loading message="Deleting mirror..." />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {listMirrorsError && <ErrorFlash message={listMirrorsError.message} />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isCreateErrorFlashOpen && (
          <ErrorFlash
            message="Failed to create mirror."
            closeFlash={closeCreateErrorFlash}
          />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isEditErrorFlashOpen && (
          <ErrorFlash
            message="Failed to update mirror."
            closeFlash={closeEditErrorFlash}
          />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isDeleteErrorFlashOpen && (
          <ErrorFlash
            message="Failed to delete mirror."
            closeFlash={closeDeleteErrorFlash}
          />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {createMirrorData &&
          createMirrorData.success &&
          isCreateSuccessFlashOpen && (
            <SuccessFlash
              message="You have successfully created a new private mirror at"
              closeFlash={closeCreateSuccessFlash}
              mirrorName={createMirrorData.data?.name as string}
              mirrorUrl={createMirrorData.data?.html_url as string}
              orgName={createMirrorData.data?.owner.login as string}
            />
          )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {editMirrorData && editMirrorData.success && isEditSuccessFlashOpen && (
          <SuccessFlash
            message="You have successfully updated mirror"
            closeFlash={closeEditSuccessFlash}
            mirrorName={editMirrorData.data?.name as string}
            orgName={editMirrorData.data?.owner.login as string}
            mirrorUrl={editMirrorData.data?.html_url as string}
          />
        )}
      </Box>
      <ForkBreadcrumbs orgData={orgData} forkData={forkData} />
      <SearchWithCreate
        placeholder="Find a mirror"
        createButtonLabel="Create mirror"
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        openCreateDialog={openCreateDialog}
      />
      {mirrors?.length === 0 ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'border.default',
            padding: '40px',
            borderRadius: '12px',
          }}
        >
          <Blankslate>
            <Box sx={{ padding: '10px' }}>
              <Blankslate.Visual>
                <Octicon icon={RepoIcon} size={24} color="fg.muted"></Octicon>
              </Blankslate.Visual>
            </Box>
            <Blankslate.Heading>No mirrors found</Blankslate.Heading>
            <Blankslate.Description>
              Please create a mirror for this fork.
            </Blankslate.Description>
          </Blankslate>
        </Box>
      ) : (
        <Table.Container>
          <DataTable
            aria-describedby="mirrors table"
            aria-labelledby="mirrors table"
            data={mirrorPaginationSet}
            columns={[
              {
                header: 'Mirror name',
                rowHeader: true,
                field: 'name',
                sortBy: 'alphanumeric',
                width: '400px',
                renderCell: (row) => {
                  return (
                    <Link
                      sx={{
                        paddingRight: '5px',
                        fontWeight: 'bold',
                        fontSize: 2,
                      }}
                      href={row.html_url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {row.name}
                    </Link>
                  )
                },
              },
              {
                header: 'Last updated',
                field: 'updated_at',
                sortBy: 'datetime',
                width: 'auto',
                renderCell: (row) => {
                  return (
                    <RelativeTime
                      date={new Date(row.updated_at)}
                      tense="past"
                    />
                  )
                },
              },
              {
                id: 'actions',
                header: '',
                width: '50px',
                align: 'end',
                renderCell: (row) => {
                  return (
                    <ActionMenu>
                      <ActionMenu.Anchor>
                        <IconButton
                          aria-label={`Actions: ${row.name}`}
                          icon={KebabHorizontalIcon}
                          variant="invisible"
                        />
                      </ActionMenu.Anchor>
                      <ActionMenu.Overlay>
                        <ActionList>
                          <ActionList.Item
                            onSelect={() => {
                              openEditDialog(row.name)
                            }}
                          >
                            <Stack align="center" direction="horizontal">
                              <Stack.Item>
                                <Octicon icon={PencilIcon}></Octicon>
                              </Stack.Item>
                              <Stack.Item>Edit mirror</Stack.Item>
                            </Stack>
                          </ActionList.Item>
                          <ActionList.Item
                            variant="danger"
                            onSelect={() => {
                              openDeleteDialog(
                                row.name,
                                mirrorPaginationSet.length,
                              )
                            }}
                          >
                            <Stack align="center" direction="horizontal">
                              <Stack.Item>
                                <Octicon icon={TrashIcon}></Octicon>
                              </Stack.Item>
                              <Stack.Item>Delete mirror</Stack.Item>
                            </Stack>
                          </ActionList.Item>
                        </ActionList>
                      </ActionMenu.Overlay>
                    </ActionMenu>
                  )
                },
              },
            ]}
            cellPadding="spacious"
          />
          <Table.Pagination
            aria-label="pagination"
            totalCount={mirrorSet.length}
            pageSize={pageSize}
            onChange={({ pageIndex }) => {
              setPageIndex(pageIndex)
            }}
          />
        </Table.Container>
      )}
      <CreateMirrorDialog
        orgLogin={orgData?.login as string}
        forkParentName={forkData?.parent?.name as string}
        forkParentOwnerLogin={forkData?.parent?.owner.login as string}
        closeDialog={closeCreateDialog}
        isOpen={isCreateDialogOpen}
        createMirror={handleOnCreateMirror}
      />
      <EditMirrorDialog
        orgLogin={orgData?.login as string}
        forkParentName={forkData?.parent?.name as string}
        forkParentOwnerLogin={forkData?.parent?.owner.login as string}
        orgId={organizationId as string}
        mirrorName={editMirrorName as string}
        closeDialog={closeEditDialog}
        isOpen={Boolean(editMirrorName)}
        editMirror={handleOnEditMirror}
      />
      <DeleteMirrorDialog
        orgLogin={orgData?.login as string}
        orgId={organizationId as string}
        orgName={orgData?.name as string}
        mirrorName={deleteMirrorName as string}
        closeDialog={closeDeleteDialog}
        isOpen={Boolean(deleteMirrorName)}
        deleteMirror={handleOnDeleteMirror}
      />
    </Box>
  )
}

export default Fork
