'use client'

import { Avatar, Link, Stack } from '@primer/react'
import { Blankslate, DataTable, Table } from '@primer/react/experimental'
import { useState } from 'react'
import { OrgsData, useOrgsData } from 'hooks/useOrganizations'
import { Search } from './components/search/Search'
import Fuse from 'fuse.js'
import { OrganizationIcon } from '@primer/octicons-react'
import { WelcomeHeader } from './components/header/WelcomeHeader'
import { ErrorFlash } from './components/flash/ErrorFlash'
import sharedStyles from 'app/styles/shared.module.css'

const Home = () => {
  const orgsData = useOrgsData()

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  // show loading table
  if (orgsData.isLoading) {
    return (
      <div>
        <WelcomeHeader />
        <Search
          placeholder="Find an organization"
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <Table.Container>
          <Table.Skeleton
            columns={[
              {
                header: 'Organization',
                rowHeader: true,
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

  // show blankslate if no organizations are found
  if (!orgsData.data || orgsData.data.length === 0) {
    return (
      <div>
        <WelcomeHeader />
        <div className={sharedStyles.stackMarginBottom}>
          {orgsData.error && (
            <ErrorFlash
              message={`Failed to fetch organizations.  ${orgsData.error.message}`}
            />
          )}
        </div>
        <Search
          placeholder="Find an organization"
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <div className={sharedStyles.blankslateWrapper}>
          <Blankslate>
            <div className={sharedStyles.blankslateIconPad}>
              <Blankslate.Visual>
                <OrganizationIcon
                  size={24}
                  className={sharedStyles.mutedIcon}
                />
              </Blankslate.Visual>
            </div>
            <Blankslate.Heading>No organizations found</Blankslate.Heading>
            <Blankslate.Description>
              Please install the app in an organization to see it here.
            </Blankslate.Description>
          </Blankslate>
        </div>
      </div>
    )
  }

  // set up search
  const fuse = new Fuse(orgsData.data, {
    keys: ['login'],
    threshold: 0.2,
  })

  // perform search if there is a search value
  let orgsSet: OrgsData = []
  if (searchValue) {
    orgsSet = fuse.search(searchValue).map((result) => result.item)
  } else {
    orgsSet = orgsData.data
  }

  // slice the data based on the pagination
  const orgsPaginationSet = orgsSet.slice(start, end)

  return (
    <div>
      <WelcomeHeader />
      <Search
        placeholder="Find an organization"
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
      <Table.Container>
        <DataTable
          aria-describedby="orgs table"
          aria-labelledby="orgs table"
          data={orgsPaginationSet}
          columns={[
            {
              header: 'Organization',
              rowHeader: true,
              field: 'login',
              sortBy: 'alphanumeric',
              renderCell: (row) => {
                return (
                  <Stack direction="horizontal" align="center">
                    <Stack.Item>
                      <Avatar src={row.avatar_url} size={32} square={true} />
                    </Stack.Item>
                    <Stack.Item>
                      <Link
                        className={sharedStyles.tableLink}
                        href={`/${row.login}`}
                      >
                        {row.login}
                      </Link>
                    </Stack.Item>
                  </Stack>
                )
              },
            },
          ]}
          cellPadding="spacious"
        />
        <Table.Pagination
          aria-label="pagination"
          totalCount={orgsSet.length}
          pageSize={pageSize}
          onChange={({ pageIndex }) => {
            setPageIndex(pageIndex)
          }}
        />
      </Table.Container>
    </div>
  )
}

export default Home
