import { getReposInOrgGQL } from 'bot/graphql'
import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ForksObject } from 'types/forks'
import { useOrgData } from './organization'

const getForksInOrg = async (accessToken: string, login: string) => {
  const res = await personalOctokit(accessToken).graphql<ForksObject>(
    getReposInOrgGQL,
    {
      login,
      isFork: true,
    },
  )

  return {
    organization: {
      repositories: {
        totalCount: res.organization.repositories.totalCount,
        nodes: res.organization.repositories.nodes.map((node) => ({
          id: node.databaseId,
          name: node.name,
          isPrivate: node.isPrivate,
          updatedAt: node.updatedAt,
          owner: {
            avatarUrl: node.owner.avatarUrl,
            login: node.owner.login,
          },
          parent: {
            name: node.parent?.name,
            owner: {
              login: node.parent?.owner.login,
              avatarUrl: node.parent?.owner.avatarUrl,
            },
          },
          languages: {
            nodes: node.languages.nodes.map((node) => ({
              name: node.name,
              color: node.color as string,
            })),
          },
          refs: {
            totalCount: node.refs.totalCount,
          },
        })),
      },
    },
  }
}

export function useForksData() {
  const session = useSession()
  const { accessToken } = (session.data?.user as any) ?? {}

  const orgData = useOrgData()

  const [forks, setForks] = useState<Awaited<
    ReturnType<typeof getForksInOrg>
  > | null>(null)

  useEffect(() => {
    if (!orgData) {
      return
    }

    getForksInOrg(accessToken, orgData.login).then((forks) => {
      setForks(forks)
    })
  }, [orgData, accessToken])

  return forks
}
