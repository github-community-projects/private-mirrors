import { ChevronRightIcon } from '@primer/octicons-react'
import { ActionList, Avatar, Box, Flash, Link, Octicon } from '@primer/react'
import { personalOctokit } from 'bot/octokit'
import { getAuthServerSideProps } from 'components/auth-guard'
import { useRouter } from 'next/router'
import type { InferGetServerSidePropsType } from 'next/types'
import { FC, useEffect, useState } from 'react'
import { trpc } from 'utils/trpc'

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

const getOrganizationInformation = async (
  accessToken: string,
  orgId: string,
) => {
  return (await personalOctokit(accessToken).orgs.get({ org: orgId })).data
}

const getForksInOrg = async (accessToken: string, owner: string) => {
  return (
    await personalOctokit(accessToken).repos.listForOrg({
      per_page: 100,
      type: 'forks',
      org: owner,
    })
  ).data
}

const getParent = async (accessToken: string, owner: string, repo: string) => {
  return (
    await personalOctokit(accessToken).repos.get({
      owner,
      repo,
    })
  ).data.parent
}

const RepoListItem: FC<{
  fork: ArrayElement<Awaited<ReturnType<typeof getForksInOrg>>>
  orgId: string
  accessToken: string
}> = ({ fork, orgId, accessToken }) => {
  const [parent, setParent] = useState<Awaited<
    ReturnType<typeof getParent>
  > | null>(null)

  useEffect(() => {
    if (!fork) {
      return
    }

    getParent(accessToken, fork.owner.login, fork.name).then((parent) => {
      setParent(parent)
    })
  }, [fork, accessToken])

  if (!fork) {
    return null
  }

  return (
    <ActionList.LinkItem
      key={fork.id}
      href={`/orgs/${orgId}/forks/${fork.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <ActionList.LeadingVisual>
        <Avatar src={parent?.owner.avatar_url ?? fork.owner.avatar_url} />
      </ActionList.LeadingVisual>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          ml: 2,
        }}
      >
        <Box
          sx={{
            fontWeight: 600,
            fontSize: 2,
            mb: 1,
          }}
        >
          {fork.owner.login}/{fork.name}
        </Box>
        <Box as="small">
          <Box>
            Forked from{' '}
            {parent ? (
              <Box
                as="span"
                sx={{
                  fontWeight: 600,
                }}
              >
                {parent.owner.login}/{parent.name}
              </Box>
            ) : (
              '...'
            )}
          </Box>
        </Box>
      </Box>
      <ActionList.TrailingVisual>
        <Octicon icon={ChevronRightIcon} />
      </ActionList.TrailingVisual>
    </ActionList.LinkItem>
  )
}

const SingleOrganization = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { accessToken } = (props.session?.user as any) ?? {}
  const router = useRouter()
  const { organizationId } = router.query
  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrganizationInformation>
  > | null>(null)
  const [forks, setForks] = useState<Awaited<
    ReturnType<typeof getForksInOrg>
  > | null>(null)
  const { data, isLoading } = trpc.octokit.checkInstallation.useQuery({
    orgId: organizationId as string,
  })

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return
    }

    getOrganizationInformation(accessToken, organizationId as string).then(
      (orgData) => {
        setOrgData(orgData)
      },
    )
  }, [organizationId, accessToken])

  useEffect(() => {
    if (!orgData) {
      return
    }

    getForksInOrg(accessToken, orgData.login).then((forks) => {
      setForks(forks)
    })
  }, [orgData, accessToken])

  if (!orgData) {
    return <div>Loading organization data...</div>
  }

  return (
    <Box>
      <Box>
        {!isLoading && !data?.installed && (
          <Flash variant="danger">
            This organization does not have the required App installed. Visit{' '}
            <Link
              href={`https://github.com/organizations/${orgData.login}/settings/installations`}
            >
              this page
            </Link>{' '}
            to install the App to the organization.
          </Flash>
        )}
      </Box>
      <h3>{orgData.login}</h3>
      <Box>
        {forks && (
          <ActionList showDividers>
            {forks.map((fork) => (
              <RepoListItem
                key={fork.id}
                fork={fork}
                orgId={String(orgData.id)}
                accessToken={accessToken}
              />
            ))}
          </ActionList>
        )}
        {forks && forks.length === 0 && <Box>No forks found</Box>}
      </Box>
    </Box>
  )
}

export default SingleOrganization

export const getServerSideProps = getAuthServerSideProps
