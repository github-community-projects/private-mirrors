'use client'

import { useParams } from 'next/navigation'
import { trpc } from '../../utils/trpc'

import { DotFillIcon, GitBranchIcon, RepoIcon } from '@primer/octicons-react'
import { Avatar, Label, Link, RelativeTime, Stack, Text } from '@primer/react'
import { Blankslate, DataTable, Table } from '@primer/react/experimental'
import { AppNotInstalledFlash } from 'app/components/flash/AppNotInstalledFlash'
import { useForksData } from 'hooks/useForks'
import { useOrgData } from 'hooks/useOrganization'
import { useState } from 'react'
import { Search } from 'app/components/search/Search'
import Fuse from 'fuse.js'
import { OrgHeader } from 'app/components/header/OrgHeader'
import { OrgBreadcrumbs } from 'app/components/breadcrumbs/OrgBreadcrumbs'
import { ErrorFlash } from 'app/components/flash/ErrorFlash'
import { useGitHubEnvironment } from 'app/context/GitHubEnvironmentProvider'
import sharedStyles from 'app/styles/shared.module.css'

const Organization = () => {
  const { organizationId } = useParams()
  const { serverUrl } = useGitHubEnvironment()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })

  const orgData = useOrgData()
  const forksData = useForksData(orgData?.data?.login)

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  // show loading table
  if (forksData.isLoading) {
    return (
      <div>
        <OrgHeader orgData={orgData.data} />
        <OrgBreadcrumbs orgData={orgData.data} />
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
      </div>
    )
  }

  // show blankslate if no forks are found
  if (
    !forksData.data ||
    forksData.data.organization.repositories.totalCount === 0
  ) {
    return (
      <div>
        <OrgHeader orgData={orgData.data} />
        <div className={sharedStyles.stackMarginBottom}>
          {forksData.error && (
            <ErrorFlash
              message={`Failed to fetch forks.  ${forksData.error.message}`}
            />
          )}
        </div>
        <OrgBreadcrumbs orgData={orgData.data} />
        <Search
          placeholder="Find a fork"
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <div className={sharedStyles.blankslateWrapper}>
          <Blankslate>
            <div className={sharedStyles.blankslateIconPad}>
              <Blankslate.Visual>
                <RepoIcon size={24} className={sharedStyles.mutedIcon} />
              </Blankslate.Visual>
            </div>
            <Blankslate.Heading>No forks found</Blankslate.Heading>
            <Blankslate.Description>
              Please fork a repo into your organization to get started.
            </Blankslate.Description>
          </Blankslate>
        </div>
      </div>
    )
  }

  const forks = forksData.data?.organization.repositories.nodes

  // set up search
  const fuse = new Fuse(forks, {
    keys: ['name', 'owner.login', 'parent.name', 'parent.owner.login'],
    threshold: 0.2,
  })

  // perform search if there is a search value
  let forksSet: typeof forks = []
  if (searchValue) {
    forksSet = fuse.search(searchValue).map((result) => result.item)
  } else {
    forksSet = forks
  }

  // slice the data based on the pagination
  const forksPaginationSet = forksSet.slice(start, end)

  return (
    <div>
      <OrgHeader orgData={orgData.data} />
      <div className={sharedStyles.stackMarginBottom}>
        {!isLoading && !data?.installed && (
          <AppNotInstalledFlash orgLogin={orgData?.data?.login as string} />
        )}
      </div>
      <OrgBreadcrumbs orgData={orgData.data} />
      <Search
        placeholder="Find a fork"
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
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
                        src={row.parent.owner.avatarUrl ?? row.owner.avatarUrl}
                        size={32}
                      />
                    </Stack.Item>
                    <Stack.Item grow={false}>
                      <Stack.Item>
                        <Link
                          className={sharedStyles.tableLink}
                          href={`/${orgData?.data?.id}/forks/${row.id}`}
                        >
                          {row.name}
                        </Link>
                        <Label variant="secondary">
                          {row.isPrivate ? 'Private' : 'Public'}
                        </Label>
                      </Stack.Item>
                      <Stack.Item>
                        <Text className={sharedStyles.mutedText}>
                          Forked from{' '}
                          <Link
                            href={`${serverUrl}/${row.parent.owner.login}/${row.parent.name}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={sharedStyles.mutedText}
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
                      <div className={sharedStyles.flexRowCenter}>
                        <GitBranchIcon
                          className={sharedStyles.mutedIcon}
                          size={16}
                        />
                        <Text className={sharedStyles.mutedTextPaddedLeft}>
                          {row.refs.totalCount}
                        </Text>
                      </div>
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
                    {languages.map((lang: { name: string; color: string }) => (
                      <Stack.Item key={lang.name} grow={false}>
                        <div className={sharedStyles.flexRowCenter}>
                          <DotFillIcon fill={lang.color} size={16} />
                          <Text>{lang.name}</Text>
                        </div>
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
    </div>
  )
}

export default Organization
