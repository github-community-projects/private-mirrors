'use client'

import { ChevronRightIcon } from '@primer/octicons-react'
import { ActionList, Avatar, Box, Octicon } from '@primer/react'
import { personalOctokit } from '../../bot/octokit'
import { FC, useEffect, useState } from 'react'
import { getForksInOrg } from 'utils/forks'

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

const getParent = async (accessToken: string, owner: string, repo: string) => {
  return (
    await personalOctokit(accessToken).rest.repos.get({
      owner,
      repo,
    })
  ).data.parent
}

export const RepoListItem: FC<{
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
      href={`/${orgId}/forks/${fork.id}`}
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
