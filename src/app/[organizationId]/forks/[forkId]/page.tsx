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
import { AppNotInstalledFlash } from 'app/components/flash/AppNotInstalledFlash'
import { MirrorSearch } from 'app/components/search/MirrorSearch'
import { useForkData } from 'utils/fork'
import { useOrgData } from 'utils/organization'
import { useCallback, useState } from 'react'
import { ForkBreadcrumbs } from 'app/components/breadcrumbs/ForkBreadcrumbs'
import { DeleteMirrorDialog } from 'app/components/dialog/DeleteMirrorDialog'
import { CreateMirrorDialog } from 'app/components/dialog/CreateMirrorDialog'
import { CreateMirrorSuccessFlash } from 'app/components/flash/CreateMirrorSuccessFlash'
import { DeleteMirrorErrorFlash } from 'app/components/flash/DeleteMirrorErrorFlash'
import { CreateMirrorLoading } from 'app/components/loading/CreateMirrorLoading'
import { DeleteMirrorLoading } from 'app/components/loading/DeleteMirrorLoading'
import { ListMirrorsErrorFlash } from 'app/components/flash/ListMirrorsErrorFlash'
import { CreateMirrorErrorFlash } from 'app/components/flash/CreateMirrorErrorFlash'
import { EditMirrorDialog } from 'app/components/dialog/EditMirrorDialog'
import { EditMirrorLoading } from 'app/components/loading/EditMirrorLoading'
import { EditMirrorSuccessFlash } from 'app/components/flash/EditMirrorSuccessFlash'
import Fuse from 'fuse.js'
import { EditMirrorErrorFlash } from 'app/components/flash/EditMirrorErrorFlash'

const Fork = () => {
  const { organizationId, forkId } = useParams()
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
  const closeDeleteDialog = useCallback(
    () => setDeleteMirrorName(null),
    [setDeleteMirrorName],
  )
  const openDeleteDialog = useCallback(
    (mirrorName: string) => setDeleteMirrorName(mirrorName),
    [setDeleteMirrorName],
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

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 5
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
      closeCreateErrorFlash()
      closeCreateSuccessFlash()
      closeEditErrorFlash()
      closeEditSuccessFlash()
      closeDeleteErrorFlash()
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
      closeCreateErrorFlash,
      closeCreateDialog,
      closeCreateSuccessFlash,
      closeDeleteErrorFlash,
      createMirror,
      refetchMirrors,
      openCreateSuccessFlash,
      openCreateErrorFlash,
      closeEditErrorFlash,
      closeEditSuccessFlash,
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
      closeCreateErrorFlash()
      closeCreateSuccessFlash()
      closeEditErrorFlash()
      closeEditSuccessFlash()
      closeDeleteErrorFlash()
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
      closeCreateErrorFlash,
      closeEditDialog,
      closeCreateSuccessFlash,
      closeDeleteErrorFlash,
      closeEditErrorFlash,
      closeEditSuccessFlash,
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
      closeCreateErrorFlash()
      closeCreateSuccessFlash()
      closeEditErrorFlash()
      closeEditSuccessFlash()
      closeDeleteErrorFlash()
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
    },
    [
      closeDeleteDialog,
      closeCreateErrorFlash,
      closeDeleteErrorFlash,
      closeCreateSuccessFlash,
      deleteMirror,
      closeEditErrorFlash,
      closeEditSuccessFlash,
      openDeleteErrorFlash,
      refetchMirrors,
      orgData,
    ],
  )

  // show loading table
  if (!mirrors || mirrorsLoading) {
    return (
      <Box>
        <ForkBreadcrumbs orgData={orgData} forkData={forkData} />
        <MirrorSearch
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
            rows={5}
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

  // set up pagination
  let mirrorPaginationSet = []
  if (searchValue) {
    mirrorPaginationSet = fuse
      .search(searchValue)
      .map((result) => result.item)
      .slice(start, end)
  } else {
    mirrorPaginationSet = mirrors.slice(start, end)
  }

  return (
    <Box>
      <Box sx={{ marginBottom: '10px' }}>
        {!isLoading && !data?.installed && (
          <AppNotInstalledFlash orgData={orgData} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {createMirrorLoading && <CreateMirrorLoading />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {editMirrorLoading && <EditMirrorLoading />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {deleteMirrorLoading && <DeleteMirrorLoading />}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {listMirrorsError && (
          <ListMirrorsErrorFlash message={listMirrorsError.message} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isCreateErrorFlashOpen && (
          <CreateMirrorErrorFlash closeFlash={closeCreateErrorFlash} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isEditErrorFlashOpen && (
          <EditMirrorErrorFlash closeFlash={closeEditErrorFlash} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {isDeleteErrorFlashOpen && (
          <DeleteMirrorErrorFlash closeFlash={closeDeleteErrorFlash} />
        )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {createMirrorData &&
          createMirrorData.success &&
          isCreateSuccessFlashOpen && (
            <CreateMirrorSuccessFlash
              closeFlash={closeCreateSuccessFlash}
              mirrorName={createMirrorData.data?.name as string}
              mirrorUrl={createMirrorData.data?.html_url as string}
              orgName={createMirrorData.data?.owner.login as string}
            />
          )}
      </Box>
      <Box sx={{ marginBottom: '10px' }}>
        {editMirrorData && editMirrorData.success && isEditSuccessFlashOpen && (
          <EditMirrorSuccessFlash
            closeFlash={closeEditSuccessFlash}
            mirrorName={editMirrorData.data?.name as string}
            orgName={editMirrorData.data?.owner.login as string}
            mirrorUrl={editMirrorData.data?.html_url as string}
          />
        )}
      </Box>
      <ForkBreadcrumbs orgData={orgData} forkData={forkData} />
      <MirrorSearch
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
                              openDeleteDialog(row.name)
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
            totalCount={
              searchValue ? mirrorPaginationSet.length : mirrors.length
            }
            pageSize={pageSize}
            onChange={({ pageIndex }) => {
              setPageIndex(pageIndex)
            }}
          />
        </Table.Container>
      )}
      <CreateMirrorDialog
        orgData={orgData}
        forkData={forkData}
        closeDialog={closeCreateDialog}
        isOpen={isCreateDialogOpen}
        createMirror={handleOnCreateMirror}
      />
      <EditMirrorDialog
        orgData={orgData}
        forkData={forkData}
        orgId={organizationId as string}
        mirrorName={editMirrorName as string}
        closeDialog={closeEditDialog}
        isOpen={Boolean(editMirrorName)}
        editMirror={handleOnEditMirror}
      />
      <DeleteMirrorDialog
        orgData={orgData}
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
