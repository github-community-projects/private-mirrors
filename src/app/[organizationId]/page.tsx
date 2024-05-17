'use client'

import { useParams } from 'next/navigation'
import { trpc } from '../../utils/trpc'

import { DotFillIcon, GitBranchIcon, RepoIcon } from '@primer/octicons-react'
import {
  Avatar,
  Box,
  Label,
  Link,
  Octicon,
  RelativeTime,
  Text,
} from '@primer/react'
import Blankslate from '@primer/react/lib-esm/Blankslate/Blankslate'
import { DataTable, Table } from '@primer/react/lib-esm/DataTable'
import { Stack } from '@primer/react/lib-esm/Stack'
import { AppNotInstalledFlash } from 'app/components/flash/AppNotInstalledFlash'
import { useForksData } from 'utils/forks'
import { useOrgData } from 'utils/organization'
import { useState } from 'react'
import { ForkSearch } from 'app/components/search/ForkSearch'
import Fuse from 'fuse.js'

const Organization = () => {
  const { organizationId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })
  const orgData = useOrgData()
  const forksData = useForksData()?.organization.repositories

  const [searchValue, setSearchValue] = useState('')

  const pageSize = 5
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  if (!forksData) {
    return (
      <Box>
        <ForkSearch searchValue={searchValue} setSearchValue={setSearchValue} />
        <Table.Container>
          <Table.Skeleton
            columns={[
              {
                header: 'Repository',
                rowHeader: true,
                width: '400px',
              },
              {
                header: 'Branches',
                width: 'auto',
              },
              {
                header: 'Language',
                width: 'auto',
              },
              {
                header: 'Updated',
                width: 'auto',
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

  let forks = forksData.nodes

  const fuse = new Fuse(forks, {
    keys: ['name', 'owner.login', 'parent.name', 'parent.owner.login'],
    threshold: 0.2,
  })

  let forksPaginationSet = []
  if (searchValue) {
    forksPaginationSet = fuse
      .search(searchValue)
      .map((result) => result.item)
      .slice(start, end)
  } else {
    forksPaginationSet = forks.slice(start, end)
  }

  return (
    <Box>
      <Box sx={{ marginBottom: '10px' }}>
        {!isLoading && !data?.installed && <AppNotInstalledFlash />}
      </Box>
      <ForkSearch searchValue={searchValue} setSearchValue={setSearchValue} />
      {forksData.totalCount === 0 ? (
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
            <Blankslate.Heading>No forks found</Blankslate.Heading>
            <Blankslate.Description>
              Please fork a repo into your organization to get started.
            </Blankslate.Description>
          </Blankslate>
        </Box>
      ) : (
        <Table.Container>
          <DataTable
            aria-describedby="forks table"
            aria-labelledby="forks table"
            data={forksPaginationSet}
            columns={[
              {
                header: 'Repository',
                rowHeader: true,
                field: 'name',
                sortBy: 'alphanumeric',
                width: '400px',
                renderCell: (row) => {
                  return (
                    <Stack direction="horizontal" align="center">
                      <Stack.Item>
                        <Avatar
                          src={
                            row.parent.owner.avatarUrl ?? row.owner.avatarUrl
                          }
                          size={32}
                        />
                      </Stack.Item>
                      <Stack.Item grow={false}>
                        <Stack.Item>
                          <Link
                            sx={{
                              paddingRight: '5px',
                              fontWeight: 'bold',
                              fontSize: 2,
                            }}
                            href={`/${orgData?.id}/forks/${row.id}`}
                          >
                            {row.name}
                          </Link>
                          <Label variant="secondary">
                            {row.isPrivate ? 'Private' : 'Public'}
                          </Label>
                        </Stack.Item>
                        <Stack.Item>
                          <Text sx={{ color: 'fg.muted' }}>
                            Forked from{' '}
                            <Link
                              href={`https://github.com/${row.parent.owner.login}/${row.parent.name}`}
                              target="_blank"
                              sx={{ color: 'fg.muted' }}
                            >
                              {row.parent.owner.login}/{row.parent.name}
                            </Link>
                          </Text>
                        </Stack.Item>
                      </Stack.Item>
                    </Stack>
                  )
                },
              },
              {
                header: 'Branches',
                field: 'refs.totalCount',
                width: 'auto',
                renderCell: (row) => {
                  return (
                    <Stack direction="horizontal">
                      <Stack.Item>
                        <Box>
                          <Octicon
                            icon={GitBranchIcon}
                            color="fg.muted"
                            size={16}
                          ></Octicon>
                          <Text sx={{ paddingLeft: '3px', color: 'fg.muted' }}>
                            {row.refs.totalCount}
                          </Text>
                        </Box>
                      </Stack.Item>
                    </Stack>
                  )
                },
              },
              {
                header: 'Languages',
                field: 'languages',
                width: 'auto',
                renderCell: (row) => {
                  const languages = row.languages.nodes

                  return (
                    <Stack direction="horizontal">
                      {languages.map((lang) => (
                        <Stack.Item key={lang.name} grow={false}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Octicon
                              icon={DotFillIcon}
                              color={lang.color}
                              size={16}
                            ></Octicon>
                            <Text>{lang.name}</Text>
                          </Box>
                        </Stack.Item>
                      ))}
                    </Stack>
                  )
                },
              },
              {
                header: 'Updated',
                field: 'updatedAt',
                sortBy: 'datetime',
                width: 'auto',
                renderCell: (row) => {
                  return (
                    <RelativeTime date={new Date(row.updatedAt)} tense="past" />
                  )
                },
              },
            ]}
            cellPadding="spacious"
          />
          <Table.Pagination
            aria-label="pagination"
            totalCount={
              searchValue ? forksPaginationSet.length : forksData.totalCount
            }
            pageSize={pageSize}
            onChange={({ pageIndex }) => {
              setPageIndex(pageIndex)
            }}
          ></Table.Pagination>
        </Table.Container>
      )}
    </Box>
  )
}

export default Organization
