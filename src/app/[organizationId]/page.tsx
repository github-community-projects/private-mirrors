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
import { useForksData } from 'hooks/useForks'
import { useOrgData } from 'hooks/useOrganization'
import { useState } from 'react'
import { Search } from 'app/components/search/Search'
import Fuse from 'fuse.js'
import { OrgHeader } from 'app/components/header/OrgHeader'
import { OrgBreadcrumbs } from 'app/components/breadcrumbs/OrgBreadcrumbs'

const Organization = () => {
  const { organizationId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })

  const orgData = useOrgData()
  const forksData = useForksData(orgData?.login)?.organization.repositories

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  // show loading table
  if (!forksData) {
    return (
      <Box>
        <OrgHeader orgData={orgData} />
        <OrgBreadcrumbs orgData={orgData} />
        <Search
          placeholder="Find a fork"
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
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
            rows={pageSize}
            cellPadding="spacious"
          />
          <Table.Pagination aria-label="pagination" totalCount={0} />
        </Table.Container>
      </Box>
    )
  }

  const forks = forksData.nodes

  // set up search
  const fuse = new Fuse(forks, {
    keys: ['name', 'owner.login', 'parent.name', 'parent.owner.login'],
    threshold: 0.2,
  })

  // perform search if there is a search value
  let forksSet = []
  if (searchValue) {
    forksSet = fuse.search(searchValue).map((result) => result.item)
  } else {
    forksSet = forks
  }

  // slice the data based on the pagination
  const forksPaginationSet = forksSet.slice(start, end)

  return (
    <Box>
      <OrgHeader orgData={orgData} />
      <Box sx={{ marginBottom: '10px' }}>
        {!isLoading && !data?.installed && (
          <AppNotInstalledFlash orgLogin={orgData?.login as string} />
        )}
      </Box>
      <OrgBreadcrumbs orgData={orgData} />
      <Search
        placeholder="Find a fork"
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
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
                              rel="noreferrer noopener"
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
            totalCount={forksSet.length}
            pageSize={pageSize}
            onChange={({ pageIndex }) => {
              setPageIndex(pageIndex)
            }}
          />
        </Table.Container>
      )}
    </Box>
  )
}

export default Organization
