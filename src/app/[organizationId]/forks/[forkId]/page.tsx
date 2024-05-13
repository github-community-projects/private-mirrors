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
import AppNotInstalled from 'app/components/AppNotInstalled'
import MirrorSearch from 'app/components/MirrorSearch'
import { useForkData } from 'utils/fork'
import { useOrgData } from 'utils/organization'
import { useCallback, useState } from 'react'
import ForkBreadcrumbs from 'app/components/ForkBreadcrumbs'
import { DeleteMirrorDialog } from 'app/components/DeleteMirrorDialog'
import { CreateMirrorDialog } from 'app/components/CreateMirrorDialog'

const Fork = () => {
  const { organizationId, forkId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })
  const orgData = useOrgData()
  const forkData = useForkData()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const closeCreateDialog = useCallback(
    () => setIsCreateOpen(false),
    [setIsCreateOpen],
  )
  const openCreateDialog = useCallback(
    () => setIsCreateOpen(true),
    [setIsCreateOpen],
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

  const pageSize = 5
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  const {
    data: createMirrorData,
    error: createMirrorError,
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
    error: deleteMirrorError,
    isLoading: deleteMirrorLoading,
    mutateAsync: deleteMirror,
  } = trpc.deleteMirror.useMutation()

  const handleOnCreateMirror = useCallback(
    async ({
      repoName,
      branchName,
    }: {
      repoName: string
      branchName: string
    }) => {
      closeCreateDialog()

      await createMirror({
        newRepoName: repoName,
        newBranchName: branchName,
        orgId: String(orgData?.id),
        forkRepoName: forkData?.name ?? '',
        forkRepoOwner: forkData?.owner.login ?? '',
        forkId: String(forkData?.id),
      })

      refetchMirrors()
    },
    [closeCreateDialog, createMirror, refetchMirrors, orgData, forkData],
  )

  const handleOnDeleteMirror = useCallback(
    async ({ mirrorName }: { mirrorName: string }) => {
      closeDeleteDialog()

      await deleteMirror({
        mirrorName,
        orgId: organizationId as string,
        orgName: orgData?.name ?? '',
      })

      refetchMirrors()
    },
    [closeDeleteDialog, deleteMirror, refetchMirrors, orgData, organizationId],
  )

  if (!mirrors) {
    return (
      <Box>
        <ForkBreadcrumbs />
        <MirrorSearch openCreateDialog={openCreateDialog} />
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
          <Table.Pagination
            aria-label="pagination"
            totalCount={0}
          ></Table.Pagination>
        </Table.Container>
      </Box>
    )
  }

  const mirrorsRow = mirrors.slice(start, end)

  return (
    <Box>
      <Box sx={{ marginBottom: '25px' }}>
        {!isLoading && !data?.installed && <AppNotInstalled />}
      </Box>
      <ForkBreadcrumbs />
      <MirrorSearch openCreateDialog={openCreateDialog} />
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
            data={mirrorsRow}
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
                          title={`Actions: ${row.name}`}
                          icon={KebabHorizontalIcon}
                          variant="invisible"
                        />
                      </ActionMenu.Anchor>
                      <ActionMenu.Overlay>
                        <ActionList>
                          <ActionList.Item onSelect={() => {}}>
                            <Stack align="center" direction="horizontal">
                              <Stack.Item>
                                <Octicon icon={PencilIcon}></Octicon>
                              </Stack.Item>
                              <Stack.Item>Edit mirror</Stack.Item>
                            </Stack>
                          </ActionList.Item>
                          <ActionList.Item
                            variant="danger"
                            onSelect={async () => {
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
            totalCount={0}
            pageSize={pageSize}
            onChange={({ pageIndex }) => {
              setPageIndex(pageIndex)
            }}
          ></Table.Pagination>
        </Table.Container>
      )}
      <CreateMirrorDialog
        closeDialog={closeCreateDialog}
        isOpen={isCreateOpen}
        onCreateMirror={handleOnCreateMirror}
      />
      <DeleteMirrorDialog
        orgId={organizationId as string}
        orgName={orgData?.name as string}
        mirrorName={deleteMirrorName as string}
        closeDialog={closeDeleteDialog}
        isOpen={Boolean(deleteMirrorName)}
        onDeleteMirror={handleOnDeleteMirror}
      />
    </Box>
  )
}

export default Fork
