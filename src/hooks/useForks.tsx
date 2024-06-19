/* eslint-disable @typescript-eslint/no-floating-promises */
import { getReposInOrgGQL } from 'bot/graphql'
import { personalOctokit } from 'bot/octokit'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ForksObject } from 'types/forks'
import { logger } from '../utils/logger'

const forksLogger = logger.getSubLogger({ name: 'useForks' })

const getForksInOrg = async (accessToken: string, login: string) => {
  const res = await personalOctokit(accessToken)
    .graphql.paginate<ForksObject>(getReposInOrgGQL, {
      login,
      isFork: true,
    })
    .catch((error: Error & { data: ForksObject }) => {
      forksLogger.error('Error fetching forks', { error })
      return error.data
    })

  // the primer datatable component requires the data to not contain null
  // values and the type returned from the graphql query contains null values
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
            name: node?.parent?.name,
            owner: {
              login: node?.parent?.owner.login,
              avatarUrl: node?.parent?.owner.avatarUrl,
            },
          },
          languages: {
            nodes: node.languages.nodes.map((node) => ({
              name: node.name,
              color: node.color,
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

export const useForksData = (login: string | undefined) => {
  const session = useSession()
  const accessToken = session.data?.user.accessToken

  const [forks, setForks] = useState<Awaited<
    ReturnType<typeof getForksInOrg>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!login || !accessToken) {
      return
    }

    setIsLoading(true)
    setError(null)

    getForksInOrg(accessToken, login)
      .then((forks) => {
        setForks(forks)
      })
      .catch((error: Error) => {
        setError(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [login, accessToken])

  return {
    data: forks,
    isLoading,
    error,
  }
}
