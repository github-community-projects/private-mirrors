'use client'

import { Avatar, Box, Link, Octicon } from '@primer/react'
import { useState } from 'react'
import { OrgsData, useOrgsData } from 'hooks/useOrganizations'
import { Search } from './components/search/Search'
import { DataTable, Table } from '@primer/react/lib-esm/DataTable'
import Fuse from 'fuse.js'
import Blankslate from '@primer/react/lib-esm/Blankslate/Blankslate'
import { OrganizationIcon } from '@primer/octicons-react'
import { Stack } from '@primer/react/lib-esm/Stack'
import { WelcomeHeader } from './components/header/WelcomeHeader'

const Home = () => {
  const orgsData = useOrgsData()

  // set search value to be empty string by default
  const [searchValue, setSearchValue] = useState('')

  // values for pagination
  const pageSize = 5
  const [pageIndex, setPageIndex] = useState(0)
  const start = pageIndex * pageSize
  const end = start + pageSize

  // show loading table
  if (orgsData.isLoading) {
    return (
      <Box>
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
            rows={5}
            cellPadding="spacious"
          />
          <Table.Pagination aria-label="pagination" totalCount={0} />
        </Table.Container>
      </Box>
    )
  }

  // set up search
  const fuse = new Fuse(orgsData.data, {
    keys: ['login'],
    threshold: 0.2,
  })

  // set up pagination
  let orgsPaginationSet: OrgsData = []
  if (searchValue) {
    orgsPaginationSet = fuse
      .search(searchValue)
      .map((result) => result.item)
      .slice(start, end)
  } else {
    orgsPaginationSet = orgsData.data.slice(start, end)
  }

  return (
    <Box>
      <WelcomeHeader />
      <Search
        placeholder="Find an organization"
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
      {orgsData.data.length === 0 ? (
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
                <Octicon
                  icon={OrganizationIcon}
                  size={24}
                  color="fg.muted"
                ></Octicon>
              </Blankslate.Visual>
            </Box>
            <Blankslate.Heading>No organizations found</Blankslate.Heading>
            <Blankslate.Description>
              Please install the app in an organization to see it here.
            </Blankslate.Description>
          </Blankslate>
        </Box>
      ) : (
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
                          sx={{
                            paddingRight: '5px',
                            fontWeight: 'bold',
                            fontSize: 2,
                          }}
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
            totalCount={
              searchValue ? orgsPaginationSet.length : orgsData.data.length
            }
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

export default Home
