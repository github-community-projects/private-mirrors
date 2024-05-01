import { personalOctokit } from 'bot/octokit'
import { useEffect, useState } from 'react'
import { getForksInOrg } from './forks'
import { ArrayElement } from 'types/array-element'
import { getRepoLanguagesGQL } from 'bot/graphql'
import { Repository } from '@octokit/graphql-schema'

const getLanguages = async (
  octokit: ReturnType<typeof personalOctokit>,
  owner: string,
  name: string,
) => {
  const res = await octokit.graphql<{
    repository: Repository
  }>(getRepoLanguagesGQL, {
    owner,
    name,
  })

  return res.repository.languages?.nodes
}

export function useLanguagesData(
  fork: ArrayElement<Awaited<ReturnType<typeof getForksInOrg>>>,
  octokit: ReturnType<typeof personalOctokit>,
) {
  const [languages, setLanguages] = useState<Awaited<
    ReturnType<typeof getLanguages>
  > | null>(null)

  useEffect(() => {
    if (!fork) {
      return
    }

    getLanguages(octokit, fork.owner.login, fork.name).then((languages) => {
      setLanguages(languages)
    })
  }, [fork, octokit])

  return languages
}
