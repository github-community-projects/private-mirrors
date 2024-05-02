'use client'

import { useParams } from 'next/navigation'
import { trpc } from '../../utils/trpc'

import { DotFillIcon, RepoIcon } from '@primer/octicons-react'
import { Avatar, Box, Label, Link, Octicon, Text } from '@primer/react'
import Blankslate from '@primer/react/lib-esm/Blankslate/Blankslate'
import { DataTable, Table } from '@primer/react/lib-esm/DataTable'
import { Stack } from '@primer/react/lib-esm/Stack'
import AppNotInstalled from 'app/components/Flashes'
import { useForksData } from 'utils/forks'
import { useOrgData } from 'utils/organization'

const Organization = () => {
  const { organizationId } = useParams()
  const { data, isLoading } = trpc.checkInstallation.useQuery({
    orgId: organizationId as string,
  })
  const orgData = useOrgData()
  const forks = useForksData()

  if (!forks) {
    return (
      <Box>
        <Table.Container>
          <Table.Skeleton
            aria-labelledby="repositories"
            aria-describedby="repositories-subtitle"
            columns={[
              {
                header: 'Repository',
                minWidth: 500,
              },
              {
                header: 'Branches',
              },
              {
                header: 'Language',
              },
              {
                header: 'Updated',
              },
            ]}
            rows={10}
            cellPadding="spacious"
          />
        </Table.Container>
      </Box>
    )
  }

  return (
    <Box>
      <Box>{!isLoading && !data?.installed && <AppNotInstalled />}</Box>
      {forks.organization.repositories.totalCount === 0 ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'border.default',
            padding: '40px',
            borderRadius: '12px',
          }}
        >
          <Blankslate>
            <Blankslate.Visual>
              <Octicon icon={RepoIcon} size={24} color="fg.muted"></Octicon>
            </Blankslate.Visual>
            <Blankslate.Heading>No forks found</Blankslate.Heading>
            <Blankslate.Description>
              Please fork a repo into your organization to get started
            </Blankslate.Description>
          </Blankslate>
        </Box>
      ) : (
        <Table.Container>
          <DataTable
            data={forks.organization.repositories.nodes}
            columns={[
              {
                header: 'Repository',
                field: 'name',
                minWidth: 500,
                renderCell: (row) => {
                  return (
                    <Stack direction="horizontal" align="center">
                      <Stack.Item grow={false}>
                        <Avatar
                          src={
                            row.parent.owner.avatarUrl ?? row.owner.avatarUrl
                          }
                          size={32}
                        />
                      </Stack.Item>
                      <Stack direction="vertical" gap="none">
                        <Stack direction="horizontal" gap="condensed">
                          <Link href={`/${orgData?.id}/forks/${row.id}`}>
                            {row.name}
                          </Link>
                          <Label variant="secondary">
                            {row.isPrivate ? 'Private' : 'Public'}
                          </Label>
                        </Stack>
                        <Stack>
                          <Text>
                            Forked from {row.parent.owner.login}/
                            {row.parent.name}
                          </Text>
                        </Stack>
                      </Stack>
                    </Stack>
                  )
                },
              },
              {
                header: 'Branches',
                field: 'refs.totalCount',
              },
              {
                header: 'Language',
                field: 'languages',
                renderCell: (row) => {
                  const languages = row.languages.nodes

                  return (
                    <Stack direction="horizontal">
                      {languages.map((lang) => (
                        <Stack
                          key={lang.name}
                          direction="horizontal"
                          align="center"
                          gap="none"
                        >
                          <Octicon
                            icon={DotFillIcon}
                            color={lang.color}
                          ></Octicon>
                          <Text>{lang.name}</Text>
                        </Stack>
                      ))}
                    </Stack>
                  )
                },
              },
              {
                header: 'Updated',
                field: 'updatedAt',
              },
            ]}
          />
        </Table.Container>
      )}
    </Box>
  )
}

export default Organization
